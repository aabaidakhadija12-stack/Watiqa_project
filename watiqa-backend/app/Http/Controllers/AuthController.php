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

        $plainCode = $this->generateSixDigitCode();
        $expiresAt = Carbon::now()->addMinutes(15);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'phone'    => $data['phone'] ?? null,
            'cin'      => $data['cin'] ?? null,
            'email_verification_code' => Hash::make($plainCode),
            'email_verification_code_expires_at' => $expiresAt,
            'email_verification_sent_at' => Carbon::now(),
        ]);

        $this->sendVerificationEmail($user->email, $plainCode, $expiresAt);

        return response()->json([
            'message' => 'تم إنشاء الحساب. تحقق من بريدك الإلكتروني وأدخل رمز التأكيد.',
            'user' => $user->only(['id', 'name', 'email', 'phone', 'cin', 'role', 'email_verified_at']),
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

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة'],
            ]);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'البريد الإلكتروني مؤكد مسبقاً']);
        }

        if (! $user->email_verification_code || ! $user->email_verification_code_expires_at) {
            return response()->json(['message' => 'لا يوجد رمز تحقق نشط. اطلب إعادة الإرسال.'], 422);
        }

        if (Carbon::now()->greaterThan($user->email_verification_code_expires_at)) {
            return response()->json(['message' => 'انتهت صلاحية رمز التحقق. اطلب إعادة الإرسال.'], 422);
        }

        if (! Hash::check($data['code'], $user->email_verification_code)) {
            throw ValidationException::withMessages([
                'code' => ['رمز التحقق غير صحيح'],
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
            'message' => 'تم تأكيد البريد الإلكتروني بنجاح',
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

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة'],
            ]);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'البريد الإلكتروني مؤكد مسبقاً']);
        }

        if ($user->email_verification_sent_at && Carbon::now()->diffInSeconds($user->email_verification_sent_at) < 60) {
            return response()->json(['message' => 'يرجى الانتظار قليلاً قبل إعادة إرسال الرمز.'], 429);
        }

        $plainCode = $this->generateSixDigitCode();
        $expiresAt = Carbon::now()->addMinutes(15);

        $user->forceFill([
            'email_verification_code' => Hash::make($plainCode),
            'email_verification_code_expires_at' => $expiresAt,
            'email_verification_sent_at' => Carbon::now(),
        ])->save();

        $this->sendVerificationEmail($user->email, $plainCode, $expiresAt);

        return response()->json(['message' => 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني']);
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

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول',
                'requires_email_verification' => true,
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('watiqa-token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
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

        return response()->json(['message' => 'Déconnecté avec succès']);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    private function generateSixDigitCode(): string
    {
        return (string) random_int(100000, 999999);
    }

    private function sendVerificationEmail(string $to, string $plainCode, Carbon $expiresAt): void
    {
        $app = config('app.name', 'Watiqa');

        $body = "مرحباً،\n\n"
            ."رمز التحقق الخاص بحسابك على {$app} هو: {$plainCode}\n"
            ."صلاحية الرمز حتى: {$expiresAt->toDateTimeString()}\n\n"
            ."إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.\n";

        Mail::raw($body, function ($message) use ($to, $app) {
            $message->to($to)->subject("{$app} - رمز التحقق");
        });
    }
}

