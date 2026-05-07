<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone'    => 'nullable|string|max:20',
            'cin'      => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'phone'    => $data['phone'] ?? null,
            'cin'      => $data['cin'] ?? null,
        ]);

        $this->sendVerificationCode($user);

        return response()->json([
            'message' => 'Account created. Please verify your email with the code we sent.',
            'user' => $user->fresh(),
            'requires_email_verification' => true,
        ], 201);
    }

    /**
     * POST /api/auth/verify-email
     */
    public function verifyEmail(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $user = $this->findUserForAuth($data['email'], $data['password']);

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email is already verified.']);
        }

        if (! $user->email_verification_code || ! $user->email_verification_code_expires_at) {
            return response()->json(['message' => 'No active verification code. Please request a new one.'], 422);
        }

        if (Carbon::now()->greaterThan($user->email_verification_code_expires_at)) {
            return response()->json(['message' => 'Verification code expired. Please request a new one.'], 422);
        }

        if (! Hash::check($data['code'], $user->email_verification_code)) {
            throw ValidationException::withMessages([
                'code' => ['Invalid verification code.'],
            ]);
        }

        $user->forceFill([
            'email_verified_at' => Carbon::now(),
            'email_verification_code' => null,
            'email_verification_code_expires_at' => null,
            'email_verification_sent_at' => null,
        ])->save();

        $user->tokens()->delete();
        $token = $user->createToken('watiqa-token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully.',
            'user' => $user->fresh(),
            'token' => $token,
        ]);
    }

    /**
     * POST /api/auth/resend-verification
     */
    public function resendVerification(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = $this->findUserForAuth($data['email'], $data['password']);

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email is already verified.']);
        }

        if ($user->email_verification_sent_at && Carbon::now()->diffInSeconds($user->email_verification_sent_at) < 60) {
            return response()->json([
                'message' => 'Please wait one minute before requesting a new code.',
            ], 429);
        }

        $this->sendVerificationCode($user);

        return response()->json([
            'message' => 'Verification code sent.',
        ]);
    }

    /**
     * POST /api/auth/login
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = $this->findUserForAuth($data['email'], $data['password']);

        if (! $user->hasVerifiedEmail()) {
            if (! $user->email_verification_code || ! $user->email_verification_code_expires_at || Carbon::now()->greaterThan($user->email_verification_code_expires_at)) {
                $this->sendVerificationCode($user);
            }

            return response()->json([
                'message' => 'Your email address is not verified. We sent you a verification code.',
                'requires_email_verification' => true,
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('watiqa-token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion reussie',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Deconnecte avec succes']);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    private function findUserForAuth(string $email, string $password): User
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        return $user;
    }

    private function generateSixDigitCode(): string
    {
        return (string) random_int(100000, 999999);
    }

    private function sendVerificationCode(User $user): void
    {
        $code = $this->generateSixDigitCode();

        $user->forceFill([
            'email_verification_code' => Hash::make($code),
            'email_verification_code_expires_at' => Carbon::now()->addMinutes(15),
            'email_verification_sent_at' => Carbon::now(),
        ])->save();

        Mail::raw(
            "Your Watiqa verification code is: {$code}\n\nThis code expires in 15 minutes.",
            fn ($message) => $message
                ->to($user->email)
                ->subject('Watiqa verification code')
        );
    }
}
