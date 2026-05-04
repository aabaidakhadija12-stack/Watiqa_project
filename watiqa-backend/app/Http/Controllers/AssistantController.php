<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AssistantController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $reply = $this->getReply($request->message);

        return response()->json([
            'reply' => $reply,
        ]);
    }

    private function getReply(string $message): string
    {
        $msg = mb_strtolower($message);

        $keywords = [
            ['words' => ['نيابة', 'naissance', 'ولادة'], 'reply' => 'لطلب عقد الازدياد، توجه لصفحة الطلبات واختر "عقد الازدياد". ستحتاج: اسم المولود، تاريخ ومكان الازدياد، أسماء الوالدين.'],
            ['words' => ['وفاة', 'décès', 'deces'], 'reply' => 'لطلب شهادة الوفاة، اختر "شهادة الوفاة". ستحتاج: اسم المتوفى، تاريخ ومكان الوفاة، هوية المُصرِّح.'],
            ['words' => ['عزوبة', 'célibat', 'celibat'], 'reply' => 'لطلب شهادة العزوبة، اختر "شهادة العزوبة" وأدخل: الاسم الكامل، تاريخ الازدياد، رقم البطاقة الوطنية.'],
            ['words' => ['سكنى', 'résidence', 'residence', 'إقامة'], 'reply' => 'لطلب شهادة السكنى، اختر "شهادة السكنى" وأدخل: الاسم الكامل، العنوان الكامل، رقم البطاقة الوطنية.'],
            ['words' => ['حياة', 'vie', 'لا يزال حياً'], 'reply' => 'لطلب شهادة الحياة، اختر "شهادة الحياة". ستحتاج فقط: الاسم الكامل ورقم البطاقة الوطنية.'],
            ['words' => ['سيرة', 'casier', 'قضائي'], 'reply' => 'لطلب السيرة القضائية، اختر "السيرة القضائية" وحدد سبب الطلب (عمل، سفر، إلخ).'],
            ['words' => ['موعد', 'rendez', 'rdv'], 'reply' => 'لأخذ موعد، توجه لصفحة "المواعيد"، اختر التاريخ والوقت المناسبَين، وأدخل سبب الزيارة.'],
            ['words' => ['تتبع', 'suivi', 'متابعة', 'طلبي'], 'reply' => 'لمتابعة طلبك، توجه لصفحة "التتبع" وأدخل رقم المتابعة الذي حصلت عليه عند تقديم الطلب.'],
        ];

        foreach ($keywords as $item) {
            foreach ($item['words'] as $word) {
                if (str_contains($msg, $word)) {
                    return $item['reply'];
                }
            }
        }

        return 'مرحباً! يمكنني مساعدتك في: طلب الوثائق (عقد الازدياد، الوفاة، العزوبة، السكنى، الحياة، السيرة القضائية)، أخذ موعد، أو تتبع طلبك. بماذا يمكنني مساعدتك؟';
    }
}

