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

    public function tts(Request $request)
    {
        $text = $request->query('text', '');
        $lang = $request->query('lang', 'ar');

        if (empty($text)) {
            return response()->json(['error' => 'No text provided'], 400);
        }

        $url = 'https://translate.googleapis.com/translate_tts?ie=UTF-8&q=' . urlencode(mb_substr($text, 0, 200)) . '&tl=' . $lang . '&client=gtx';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $audio = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$audio) {
            return response()->json(['error' => 'TTS generation failed'], 500);
        }

        return response($audio)
            ->header('Content-Type', 'audio/mpeg')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Access-Control-Allow-Origin', '*');
    }

    private function getReply(string $message): string
    {
        $msg = mb_strtolower($message);
        $isArabic = preg_match('/\p{Arabic}/u', $message);

        // =============================================
        // RULES — chaque entrée peut avoir plusieurs
        // mots-clés FR et AR, et une réponse détaillée
        // =============================================
        $rules = [

            // -------- ACTE DE NAISSANCE --------
            'naissance' => [
                'ar' => ['ولادة', 'ازدياد', 'مولود', 'عقد الازدياد', 'رسم الولادة', 'شهادة ولادة', 'وثيقة ولادة'],
                'fr' => ['naissance', 'naitre', 'naître', 'acte de naissance', 'né', 'née', 'extrait naissance'],
                'reply_ar' =>
"📄 طلب رسم الولادة

الخطوات:
1️⃣ توجّه إلى صفحة «الشباك»
2️⃣ اختر «رسم الولادة»
3️⃣ أدخل المعلومات التالية:
   • الاسم الشخصي والعائلي
   • تاريخ ومكان الازدياد
   • اسم الأب واسم الأم
   • رقم البطاقة الوطنية
4️⃣ اختر نوع النسخة: كاملة أو مستخرج
5️⃣ اختر طريقة التسليم: استلام أو توصيل للمنزل
6️⃣ اضغط «إرسال الطلب»

⏱️ مدة المعالجة: 3 إلى 5 أيام عمل
✅ يمكنك تتبع حالة طلبك من صفحة «المتابعة»",
                'reply_fr' =>
"📄 Demande d'acte de naissance

Étapes à suivre :
1️⃣ Rendez-vous sur la page « Guichet »
2️⃣ Sélectionnez « Acte de naissance »
3️⃣ Renseignez les informations suivantes :
   • Nom et prénom du demandeur
   • Date et lieu de naissance
   • Nom du père et de la mère
   • Numéro de CIN
4️⃣ Choisissez le type : copie intégrale ou extrait
5️⃣ Choisissez la livraison : retrait en commune ou à domicile
6️⃣ Cliquez sur « Envoyer la demande »

⏱️ Délai de traitement : 3 à 5 jours ouvrables
✅ Suivez l'état de votre demande sur la page « Suivi »"
            ],

            // -------- CERTIFICAT DE RÉSIDENCE --------
            'residence' => [
                'ar' => ['سكنى', 'إقامة', 'اقامة', 'سكن', 'شهادة السكنى', 'شهادة الإقامة', 'محل الإقامة', 'شهادة سكن', 'عنوان'],
                'fr' => ['résidence', 'residence', 'domicile', 'habite', 'certificat de résidence', 'adresse', 'lieu de résidence'],
                'reply_ar' =>
"🏠 شهادة السكنى

الخطوات:
1️⃣ توجّه إلى صفحة «الشباك»
2️⃣ اختر «شهادة الإقامة»
3️⃣ أدخل المعلومات التالية:
   • الاسم الكامل
   • العنوان الكامل (شارع، حي، مدينة)
   • الرمز البريدي
   • رقم البطاقة الوطنية
   • الهاتف
4️⃣ حدد سبب الطلب
5️⃣ اختر طريقة التسليم
6️⃣ اضغط «إرسال الطلب»

⏱️ مدة المعالجة: 1 إلى 2 يوم عمل
✅ تتبع طلبك من صفحة «المتابعة»",
                'reply_fr' =>
"🏠 Certificat de résidence

Étapes à suivre :
1️⃣ Rendez-vous sur la page « Guichet »
2️⃣ Sélectionnez « Certificat de résidence »
3️⃣ Renseignez les informations suivantes :
   • Nom complet
   • Adresse complète (rue, quartier, ville)
   • Code postal
   • Numéro de CIN
   • Téléphone
4️⃣ Précisez le motif de la demande
5️⃣ Choisissez le mode de livraison
6️⃣ Cliquez sur « Envoyer la demande »

⏱️ Délai de traitement : 1 à 2 jours ouvrables
✅ Suivez votre demande sur la page « Suivi »"
            ],

            // -------- CERTIFICAT DE VIE --------
            'vie' => [
                'ar' => ['حياة', 'حي', 'شهادة الحياة', 'قيد الحياة', 'cnss', 'تقاعد', 'معاش'],
                'fr' => ['vie', 'vivant', 'certificat de vie', 'retraite', 'pension', 'cnss'],
                'reply_ar' =>
"💚 شهادة الحياة

الخطوات:
1️⃣ توجّه إلى صفحة «الشباك»
2️⃣ اختر «شهادة الحياة»
3️⃣ أدخل المعلومات التالية:
   • الاسم الكامل
   • تاريخ الازدياد
   • رقم البطاقة الوطنية
   • المهنة أو الجهة الطالبة (CNSS، تقاعد...)
4️⃣ أرسل الطلب

⏱️ مدة المعالجة: 1 إلى 2 يوم عمل
ℹ️ تُستخدم هذه الوثيقة بصفة خاصة لملفات CNSS والتقاعد",
                'reply_fr' =>
"💚 Certificat de vie

Étapes à suivre :
1️⃣ Rendez-vous sur la page « Guichet »
2️⃣ Sélectionnez « Certificat de vie »
3️⃣ Renseignez les informations suivantes :
   • Nom complet
   • Date de naissance
   • Numéro de CIN
   • Organisme demandeur (CNSS, retraite...)
4️⃣ Envoyez la demande

⏱️ Délai de traitement : 1 à 2 jours ouvrables
ℹ️ Ce certificat est principalement utilisé pour les dossiers CNSS et de retraite"
            ],

            // -------- CERTIFICAT DE CÉLIBAT --------
            'celibat' => [
                'ar' => ['عزوبة', 'عازب', 'عزباء', 'شهادة العزوبة', 'غير متزوج'],
                'fr' => ['célibat', 'celibat', 'celibataire', 'célibataire', 'non marié'],
                'reply_ar' =>
"💍 شهادة العزوبة

الخطوات:
1️⃣ توجّه إلى صفحة «الشباك»
2️⃣ اختر «شهادة العزوبة»
3️⃣ أدخل المعلومات التالية:
   • الاسم الشخصي والعائلي
   • تاريخ ومكان الازدياد
   • رقم البطاقة الوطنية
   • الحالة المدنية: أعزب/عزباء
4️⃣ حدد سبب الطلب
5️⃣ اختر طريقة التسليم
6️⃣ اضغط «إرسال الطلب»

⏱️ مدة المعالجة: 2 إلى 3 أيام عمل",
                'reply_fr' =>
"💍 Certificat de célibat

Étapes à suivre :
1️⃣ Rendez-vous sur la page « Guichet »
2️⃣ Sélectionnez « Certificat de célibat »
3️⃣ Renseignez les informations suivantes :
   • Nom et prénom
   • Date et lieu de naissance
   • Numéro de CIN
   • Situation familiale : célibataire
4️⃣ Précisez le motif de la demande
5️⃣ Choisissez le mode de livraison
6️⃣ Cliquez sur « Envoyer la demande »

⏱️ Délai de traitement : 2 à 3 jours ouvrables"
            ],

            // -------- CASIER JUDICIAIRE --------
            'casier' => [
                'ar' => ['سجل عدلي', 'عدلي', 'قضائي', 'سوابق', 'السيرة القضائية', 'b2', 'b3', 'سجل', 'جنائي'],
                'fr' => ['casier', 'judiciaire', 'antécédent', 'b2', 'b3', 'casier judiciaire', 'extrait casier'],
                'reply_ar' =>
"⚖️ السجل العدلي

الخطوات:
1️⃣ توجّه إلى صفحة «الشباك»
2️⃣ اختر «السجل العدلي»
3️⃣ أدخل المعلومات التالية:
   • الاسم الكامل
   • تاريخ ومكان الازدياد
   • رقم البطاقة الوطنية
4️⃣ اختر نوع المستخرج:
   • B2 : للاستخدام الخاص (عمل، سفر...)
   • B3 : للجهات القضائية
5️⃣ حدد موضوع الطلب (عمل، تأشيرة، إدارة...)
6️⃣ اضغط «إرسال الطلب»

⏱️ مدة المعالجة: 5 إلى 7 أيام عمل",
                'reply_fr' =>
"⚖️ Casier judiciaire

Étapes à suivre :
1️⃣ Rendez-vous sur la page « Guichet »
2️⃣ Sélectionnez « Casier judiciaire »
3️⃣ Renseignez les informations suivantes :
   • Nom complet
   • Date et lieu de naissance
   • Numéro de CIN
4️⃣ Choisissez le type d'extrait :
   • B2 : usage privé (emploi, voyage...)
   • B3 : usage judiciaire
5️⃣ Précisez l'objet de la demande (emploi, visa, administration...)
6️⃣ Cliquez sur « Envoyer la demande »

⏱️ Délai de traitement : 5 à 7 jours ouvrables"
            ],

            // -------- ACTE DE DÉCÈS --------
            'deces' => [
                'ar' => ['وفاة', 'موت', 'متوفى', 'رسم الوفاة', 'توفي'],
                'fr' => ['décès', 'deces', 'mort', 'acte de décès', 'décédé'],
                'reply_ar' =>
"🕊️ رسم الوفاة

الخطوات:
1️⃣ توجّه إلى صفحة «الشباك»
2️⃣ اختر «رسم الوفاة»
3️⃣ أدخل المعلومات التالية:
   • اسم المتوفى (الاسم الشخصي والعائلي)
   • تاريخ ومكان الوفاة
   • اسمك الكامل وصلة القرابة
   • رقم البطاقة الوطنية
4️⃣ اختر عدد النسخ المطلوبة
5️⃣ اختر طريقة التسليم
6️⃣ اضغط «إرسال الطلب»

⏱️ مدة المعالجة: 2 إلى 3 أيام عمل",
                'reply_fr' =>
"🕊️ Acte de décès

Étapes à suivre :
1️⃣ Rendez-vous sur la page « Guichet »
2️⃣ Sélectionnez « Acte de décès »
3️⃣ Renseignez les informations suivantes :
   • Nom du défunt (nom et prénom)
   • Date et lieu du décès
   • Votre nom complet et lien de parenté
   • Numéro de CIN
4️⃣ Choisissez le nombre de copies
5️⃣ Choisissez le mode de livraison
6️⃣ Cliquez sur « Envoyer la demande »

⏱️ Délai de traitement : 2 à 3 jours ouvrables"
            ],

            // -------- RENDEZ-VOUS --------
            'rdv' => [
                'ar' => ['موعد', 'لقاء', 'حجز', 'تحديد موعد', 'أخذ موعد', 'حجز موعد', 'ميعاد'],
                'fr' => ['rendez-vous', 'rdv', 'prendre rendez', 'réserver', 'créneau', 'rendez vous'],
                'reply_ar' =>
"📅 حجز موعد

الخطوات:
1️⃣ توجّه إلى صفحة «المواعيد»
2️⃣ اختر الجماعة المختصة
3️⃣ اختر نوع الخدمة
4️⃣ اختر التاريخ المناسب
5️⃣ اختر الوقت المتاح
6️⃣ أدخل سبب الزيارة
7️⃣ اضغط «تأكيد الموعد»

⚠️ يجب أن تكون مسجلاً ومتصلاً بحسابك
✅ ستتلقى تأكيداً فورياً للموعد",
                'reply_fr' =>
"📅 Prise de rendez-vous

Étapes à suivre :
1️⃣ Rendez-vous sur la page « Rendez-vous »
2️⃣ Choisissez la commune concernée
3️⃣ Sélectionnez le type de service
4️⃣ Choisissez une date disponible
5️⃣ Sélectionnez un créneau horaire
6️⃣ Indiquez le motif de votre visite
7️⃣ Cliquez sur « Confirmer le rendez-vous »

⚠️ Vous devez être connecté à votre compte
✅ Vous recevrez une confirmation immédiate"
            ],

            // -------- SUIVI --------
            'suivi' => [
                'ar' => ['تتبع', 'متابعة', 'طلبي', 'أين', 'حالة طلبي', 'رقم التتبع', 'وين', 'كيفاش نتبع', 'مين وصل'],
                'fr' => ['suivi', 'suivre', 'statut', 'où en est', 'numéro de suivi', 'état de ma demande', 'tracker', 'ma demande'],
                'reply_ar' =>
"🔍 متابعة طلبك

الخطوات:
1️⃣ توجّه إلى صفحة «المتابعة»
2️⃣ أدخل رقم الملف الذي حصلت عليه عند إرسال الطلب
3️⃣ اضغط «بحث»

حالات الطلب:
🟡 في الانتظار — الطلب مستلَم وينتظر المعالجة
🔵 قيد المعالجة — الطلب يُعالَج حالياً
🟢 تمت الموافقة — الوثيقة جاهزة للاستلام
🔴 مرفوض — اتصل بالجماعة لمزيد من المعلومات

ℹ️ يمكنك أيضاً مراجعة طلباتك من صفحة «متابعة طلباتك» بعد تسجيل الدخول",
                'reply_fr' =>
"🔍 Suivi de votre demande

Étapes à suivre :
1️⃣ Rendez-vous sur la page « Suivi »
2️⃣ Saisissez le numéro de dossier reçu lors de l'envoi de votre demande
3️⃣ Cliquez sur « Rechercher »

États possibles :
🟡 En attente — Demande reçue, en attente de traitement
🔵 En traitement — Demande en cours de traitement
🟢 Approuvé — Document prêt à être retiré
🔴 Rejeté — Contactez votre commune pour plus d'informations

ℹ️ Vous pouvez aussi consulter vos demandes depuis la page « Suivi » après connexion"
            ],

            // -------- INSCRIPTION --------
            'inscription' => [
                'ar' => ['تسجيل', 'حساب جديد', 'إنشاء حساب', 'كيف أسجل'],
                'fr' => ['inscription', 'créer un compte', 's\'inscrire', 'enregistrer', 'créer compte'],
                'reply_ar' =>
"👤 إنشاء حساب جديد

الخطوات:
1️⃣ اضغط على «إنشاء حساب» في شريط التنقل
2️⃣ أدخل اسمك الكامل، بريدك الإلكتروني وكلمة مرور
3️⃣ أكد كلمة المرور
4️⃣ اضغط «إنشاء حساب»
5️⃣ ستصلك رسالة على بريدك الإلكتروني للتفعيل
6️⃣ أدخل رمز التحقق
7️⃣ حسابك جاهز! يمكنك الآن تقديم طلباتك

ℹ️ الحساب مجاني وآمن",
                'reply_fr' =>
"👤 Créer un compte

Étapes à suivre :
1️⃣ Cliquez sur « S'inscrire » dans la barre de navigation
2️⃣ Saisissez votre nom complet, email et mot de passe
3️⃣ Confirmez votre mot de passe
4️⃣ Cliquez sur « Créer un compte »
5️⃣ Un email de vérification vous sera envoyé
6️⃣ Saisissez le code de vérification reçu
7️⃣ Votre compte est prêt ! Vous pouvez soumettre vos demandes

ℹ️ Le compte est gratuit et sécurisé"
            ],

            // -------- CONNEXION --------
            'connexion' => [
                'ar' => ['تسجيل الدخول', 'دخول', 'login', 'كيف أتصل', 'نسيت كلمة المرور'],
                'fr' => ['connexion', 'connecter', 'login', 'mot de passe oublié', 'se connecter'],
                'reply_ar' =>
"🔐 تسجيل الدخول

الخطوات:
1️⃣ اضغط على «تسجيل الدخول» في شريط التنقل
2️⃣ أدخل بريدك الإلكتروني وكلمة المرور
3️⃣ اضغط «تسجيل الدخول»

⚠️ في حال نسيان كلمة المرور: تواصل مع الدعم
ℹ️ يجب أن يكون بريدك الإلكتروني مفعَّلاً",
                'reply_fr' =>
"🔐 Connexion à votre compte

Étapes à suivre :
1️⃣ Cliquez sur « Connexion » dans la barre de navigation
2️⃣ Saisissez votre email et mot de passe
3️⃣ Cliquez sur « Se connecter »

⚠️ En cas d'oubli du mot de passe : contactez le support
ℹ️ Votre email doit être vérifié au préalable"
            ],

            // -------- DÉLAIS --------
            'delais' => [
                'ar' => ['مدة', 'كم من الوقت', 'متى', 'آجال', 'وقت'],
                'fr' => ['délai', 'combien de temps', 'durée', 'quand', 'temps'],
                'reply_ar' =>
"⏱️ آجال معالجة الطلبات

• رسم الولادة : 3 إلى 5 أيام عمل
• شهادة الإقامة : 1 إلى 2 يوم عمل
• شهادة الحياة : 1 إلى 2 يوم عمل
• شهادة العزوبة : 2 إلى 3 أيام عمل
• رسم الوفاة : 2 إلى 3 أيام عمل
• السجل العدلي : 5 إلى 7 أيام عمل

ℹ️ الآجال تُحسب من تاريخ تأكيد الطلب
✅ يمكنك تتبع حالة طلبك من صفحة «المتابعة»",
                'reply_fr' =>
"⏱️ Délais de traitement

• Acte de naissance : 3 à 5 jours ouvrables
• Certificat de résidence : 1 à 2 jours ouvrables
• Certificat de vie : 1 à 2 jours ouvrables
• Certificat de célibat : 2 à 3 jours ouvrables
• Acte de décès : 2 à 3 jours ouvrables
• Casier judiciaire : 5 à 7 jours ouvrables

ℹ️ Les délais sont calculés à partir de la confirmation de la demande
✅ Suivez l'avancement de votre dossier sur la page « Suivi »"
            ],

            // -------- DOCUMENTS NÉCESSAIRES --------
            'documents' => [
                'ar' => ['وثائق مطلوبة', 'ما أحتاج', 'ما اللازم', 'ما الوثائق', 'مستندات'],
                'fr' => ['documents nécessaires', 'pièces', 'justificatif', 'que faut-il', 'besoin de quoi'],
                'reply_ar' =>
"📋 الوثائق اللازمة بصفة عامة

للجميع الطلبات:
• البطاقة الوطنية (CIN) — رقمها الكامل
• الاسم الكامل
• تاريخ ومكان الازدياد

حسب نوع الطلب قد تحتاج إضافة:
• العنوان الكامل ← شهادة الإقامة
• اسم الأب والأم ← رسم الولادة
• بيانات المتوفى ← رسم الوفاة
• سبب الطلب ← السجل العدلي

💡 اسألني عن وثيقة بعينها لمزيد من التفاصيل!",
                'reply_fr' =>
"📋 Documents généralement nécessaires

Pour toutes les demandes :
• CIN (numéro complet)
• Nom et prénom
• Date et lieu de naissance

Selon le type de demande, il peut aussi falloir :
• Adresse complète ← Certificat de résidence
• Noms du père et de la mère ← Acte de naissance
• Informations sur le défunt ← Acte de décès
• Motif de la demande ← Casier judiciaire

💡 Demandez-moi des détails sur un document précis !"
            ],

            // -------- CONTACT / COMMUNE --------
            'contact' => [
                'ar' => ['تواصل', 'اتصل', 'عنوان', 'هاتف', 'جماعة', 'مقاطعة'],
                'fr' => ['contact', 'contacter', 'adresse', 'téléphone', 'commune', 'mairie'],
                'reply_ar' =>
"📞 التواصل مع الجماعة

للتواصل المباشر مع الجماعة:
1️⃣ استخدم صفحة «المواعيد» لحجز موعد حضوري
2️⃣ أو توجّه شخصياً إلى مقر الجماعة المعنية

ℹ️ منصة وثيقة تتيح لك:
• تقديم طلباتك عبر الإنترنت 24/24
• تتبع حالة ملفاتك
• حجز مواعيد مع الجماعة",
                'reply_fr' =>
"📞 Contacter la commune

Pour contacter directement la commune :
1️⃣ Utilisez la page « Rendez-vous » pour réserver un rendez-vous en présentiel
2️⃣ Ou présentez-vous directement au siège de la commune concernée

ℹ️ La plateforme Watiqa vous permet de :
• Soumettre vos demandes en ligne 24h/24
• Suivre l'état de vos dossiers
• Prendre rendez-vous avec votre commune"
            ],
        ];

        // Score-based matching: find the rule with the most keyword hits
        $bestScore = 0;
        $bestReply = null;

        foreach ($rules as $rule) {
            $score = 0;

            foreach ($rule['fr'] as $word) {
                if (str_contains($msg, mb_strtolower($word))) {
                    // Longer/more specific keywords get higher weight
                    $score += mb_strlen($word) > 5 ? 3 : 1;
                }
            }
            foreach ($rule['ar'] as $word) {
                if (str_contains($msg, $word)) {
                    $score += mb_strlen($word) > 3 ? 3 : 1;
                }
            }

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestReply = $isArabic ? $rule['reply_ar'] : $rule['reply_fr'];
            }
        }

        if ($bestScore > 0 && $bestReply !== null) {
            return $bestReply;
        }

        // Fallback
        if ($isArabic) {
            return "👋 مرحباً! أنا مساعد وثيقة، هنا لمساعدتك في الخدمات الإدارية المغربية.

يمكنني مساعدتك في:

📄 طلب الوثائق الرسمية
   • رسم الولادة
   • شهادة الإقامة
   • شهادة الحياة
   • شهادة العزوبة
   • السجل العدلي
   • رسم الوفاة

📅 حجز موعد مع جماعتك
🔍 متابعة حالة طلبك
👤 التسجيل وتسجيل الدخول
⏱️ الاطلاع على آجال المعالجة

بماذا يمكنني مساعدتك؟";
        }

        return "👋 Bonjour ! Je suis l'assistant Watiqa, ici pour vous aider avec les services administratifs marocains.

Je peux vous aider à :

📄 Demander des documents officiels
   • Acte de naissance
   • Certificat de résidence
   • Certificat de vie
   • Certificat de célibat
   • Casier judiciaire
   • Acte de décès

📅 Prendre un rendez-vous auprès de votre commune
🔍 Suivre l'état de votre demande
👤 Créer un compte ou se connecter
⏱️ Connaître les délais de traitement

Comment puis-je vous aider ?";
    }
}
