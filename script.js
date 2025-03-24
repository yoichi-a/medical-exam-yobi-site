document.addEventListener("DOMContentLoaded", function() {
    // ========================
    // URLパラメータなどを取得
    // ========================
    const repositoryName = ''; // GitHub Pages等で階層がある場合に指定。なければ空
    const urlParams = new URLSearchParams(window.location.search);
    const year = urlParams.get('year');    // 例: "2025"
    const part = urlParams.get('part');    // 例: "1"
    const subject = urlParams.get('subject'); // 例: "anatomy"

    // 科目名を日本語表記にするマッピング（必要に応じて拡張）
    const subjectNames = {
        anatomy: '解剖学',
        physiology: '生理学',
        biochemistry: '生化学',
        immunology: '免疫学',
        pharmacology: '薬理学',
        pathology: '病理学',
        forensic_medicine: '法医学',
        microbiology: '微生物学',
        hygiene: '衛生学',
        internal_medicine: '内科学',
        pediatrics: '小児科学',
        psychiatry: '精神科学',
        surgery: '外科学',
        orthopedics: '整形外科学',
        obstetrics_gynecology: '産科・婦人科学',
        dermatology: '皮膚科学',
        urology: '泌尿器科学',
        otorhinolaryngology: '耳鼻咽喉科学',
        ophthalmology: '眼科学',
        radiology: '放射線科学',
        emergency_medicine: '救急医学'
    };

    // タイトル更新
    const problemTitle = document.getElementById('problem-title');
    const japaneseSubjectName = subjectNames[subject] || '未知の科目';
    if (problemTitle) {
        problemTitle.textContent = `${year}年 ${japaneseSubjectName}`;
    }

    // ========================
    // HTML要素を取得
    // ========================
    const questionText   = document.getElementById("question-text");
    const choicesList    = document.getElementById("choices-list");
    const questionImage  = document.getElementById("question-image");
    const answerText     = document.getElementById("answer-text");
    const answerImage    = document.getElementById("answer-image");
    const answerBtn      = document.getElementById("answer-btn");
    const prevBtn        = document.getElementById("prev-btn");
    const nextBtn        = document.getElementById("next-btn");
    const currentNumber  = document.getElementById("current-number");
    const totalNumber    = document.getElementById("total-number");
    const progressBar    = document.getElementById("progress-bar");
    const progressRatio  = document.getElementById("progress-ratio");
    const languageSelect = document.getElementById("language-select");
    const backButton     = document.getElementById("back-btn");

    let questions = [];
    let currentQuestionIndex = 0;
    let currentLanguage = 'ja';  // 初期言語

    // ========================
    // 問題データを読み込む
    // ========================
    async function loadQuestions() {
        try {
            // 例: data/2025/part1/anatomy.json
            const response = await fetch(`${repositoryName}/data/${year}/part${part}/${subject}.json`);
            if (!response.ok) {
                throw new Error(`サーバーエラー: ${response.statusText}`);
            }
            questions = await response.json();

            if (questions.length === 0) {
                throw new Error('問題データがありません。');
            }
            totalNumber.textContent = questions.length;
            displayQuestion();
        } catch (error) {
            console.error(error);
            alert(`問題データの読み込みに失敗しました: ${error.message}`);
        }
    }

    // ========================
    // 問題を表示する
    // ========================
    function displayQuestion() {
        if (questions.length > 0) {
            const currentQuestion = questions[currentQuestionIndex];

            // 問題文 (多言語対応)
            if (currentQuestion.question && typeof currentQuestion.question === 'object') {
                questionText.textContent = currentQuestion.question[currentLanguage] || '問題文がありません。';
            } else {
                questionText.textContent = currentQuestion.question || '問題文がありません。';
            }

            // 選択肢リスト
            choicesList.innerHTML = '';
            if (currentQuestion.choices) {
                for (const [key, value] of Object.entries(currentQuestion.choices)) {
                    const li = document.createElement('li');
                    // 多言語オブジェクトなら
                    if (value && typeof value === 'object') {
                        li.textContent = `${key}: ${value[currentLanguage] || '---'}`;
                    } else {
                        li.textContent = `${key}: ${value}`;
                    }
                    choicesList.appendChild(li);
                }
            }

            // 問題の画像
            if (currentQuestion.image) {
                questionImage.src = `${repositoryName}/images/${currentQuestion.image}.png`;
                questionImage.style.display = 'block';
            } else {
                questionImage.style.display = 'none';
            }

            // 解答テキスト類を初期非表示
            answerText.style.display = "none";
            answerText.textContent = "";
            answerImage.style.display = "none";

            // 進捗表示
            currentNumber.textContent = currentQuestionIndex + 1;
            prevBtn.disabled = (currentQuestionIndex === 0);
            nextBtn.disabled = (currentQuestionIndex === questions.length - 1);
            answerBtn.disabled = false;

            // 進捗バー
            progressBar.value = currentQuestionIndex + 1;
            progressBar.max = questions.length;
            const percent = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
            progressRatio.textContent = percent + "%";
        } else {
            questionText.textContent = '問題が見つかりません。';
            answerBtn.disabled = true;
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    // 解答表示ボタン
    answerBtn.addEventListener("click", function() {
        if (questions.length === 0) return;
        const currentQuestion = questions[currentQuestionIndex];

        answerText.style.display = "block";
        // 解説 (多言語)
        let rawExplanation = "";
        if (currentQuestion.explanation && typeof currentQuestion.explanation === 'object') {
            rawExplanation = currentQuestion.explanation[currentLanguage] || "解説がありません。";
        } else {
            rawExplanation = currentQuestion.explanation || "解説がありません。";
        }
        // 改行→<br> 変換
        rawExplanation = rawExplanation
          .replace(/\r\n/g, "\n")
          .replace(/\n\n/g, "<br><br>")
          .replace(/\n/g, "<br>");

        // 解答が配列の場合
        if (Array.isArray(currentQuestion.answer)) {
            const correctAnswers = currentQuestion.answer.join(", ");
            answerText.innerHTML = `正解：${correctAnswers}<br>${rawExplanation}`;
        } else {
            answerText.innerHTML = `正解：${currentQuestion.answer}<br>${rawExplanation}`;
        }

        // 解答画像
        if (currentQuestion.answerImage) {
            answerImage.src = `${repositoryName}/images/${currentQuestion.answerImage}.png`;
            answerImage.style.display = 'block';
        } else {
            answerImage.style.display = 'none';
        }

        answerBtn.disabled = true;
    });

    // 次の問題
    nextBtn.addEventListener("click", function() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        }
    });

    // 前の問題
    prevBtn.addEventListener("click", function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    });

    // 戻るボタン (part1_2025.htmlなどへ)
    if (backButton) {
        if (year && part === '1') {
            backButton.onclick = function() {
                window.location.href = `${repositoryName}/part1_${year}.html`;
            };
        } else if (year && part === '2') {
            backButton.onclick = function() {
                window.location.href = `${repositoryName}/part2_${year}.html`;
            };
        } else {
            backButton.onclick = function() {
                window.location.href = `${repositoryName}/index.html`;
            };
        }
    }

    // 言語切り替え
    languageSelect.addEventListener("change", function() {
        currentLanguage = languageSelect.value;
        displayQuestion();
    });

    // =======================
    // 初期化：問題読み込み
    // =======================
    loadQuestions();

    // =======================
    // フィードバック機能
    // =======================
    const feedbackGoodBtn   = document.getElementById("feedback-good-btn");
    const feedbackBadBtn    = document.getElementById("feedback-bad-btn");
    const feedbackModal     = document.getElementById("feedback-modal");
    const feedbackForm      = document.getElementById("feedback-form");
    const feedbackSendBtn   = document.getElementById("feedback-send-btn");
    const feedbackCancelBtn = document.getElementById("feedback-cancel-btn");
    const feedbackTargetLabel = document.getElementById("feedback-target-label");
    const feedbackComments  = document.getElementById("feedback-comments");

    // Googleフォーム(非表示フォーム)要素
    const googleForm        = document.getElementById("google-form");
    const gFormYear         = document.getElementById("gFormYear");
    const gFormSubject      = document.getElementById("gFormSubject");
    const gFormQuestionNo   = document.getElementById("gFormQuestionNo");
    const gFormFeedbackType = document.getElementById("gFormFeedbackType");
    const gFormItems        = document.getElementById("gFormItems");
    const gFormComments     = document.getElementById("gFormComments");

    // 良い評価ボタン
    feedbackGoodBtn.addEventListener("click", () => {
        openFeedbackModal("良い評価");
    });
    // 悪い評価ボタン
    feedbackBadBtn.addEventListener("click", () => {
        openFeedbackModal("悪い評価");
    });

    function openFeedbackModal(labelText) {
        feedbackForm.reset();
        feedbackComments.value = "";
        feedbackTargetLabel.textContent = `評価種別: ${labelText}`;
        feedbackModal.style.display = "block";
    }

    // キャンセル => モーダルを閉じる
    feedbackCancelBtn.addEventListener("click", () => {
        feedbackModal.style.display = "none";
    });

    // 送信ボタン => GoogleフォームにPOST
    feedbackSendBtn.addEventListener("click", () => {
        if (questions.length === 0) {
            alert("問題データがありません。");
            return;
        }

        // チェックボックスの取得
        const selectedFeedbacks = Array.from(
            feedbackForm.querySelectorAll('input[name="feedback"]:checked')
        ).map(input => input.value);

        const commentValue = feedbackComments.value;
        const feedbackType = feedbackTargetLabel.textContent.replace("評価種別: ", "");
        const questionNo   = currentQuestionIndex + 1;  // 1-based

        // hiddenフォームに値をセット
        gFormYear.value         = year || "";     // 例: "2025"
        gFormSubject.value      = subject || "";  // 例: "anatomy"
        gFormQuestionNo.value   = questionNo;
        gFormFeedbackType.value = feedbackType;
        gFormItems.value        = selectedFeedbacks.join(", ");
        gFormComments.value     = commentValue;

        // 送信 (画面遷移はしない)
        googleForm.submit();

        alert("フィードバックを送信しました。ありがとうございました。");
        feedbackModal.style.display = "none";
    });
});
