document.addEventListener("DOMContentLoaded", function() {
    const repositoryName = '';

    // URLからパラメータを取得（年度・partなど）
    const urlParams = new URLSearchParams(window.location.search);
    const year = urlParams.get('year');
    const part = urlParams.get('part');
    const subject = urlParams.get('subject');

    // 科目名マッピング
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
    const japaneseSubjectName = subjectNames[subject] || '未知の科目';

    // タイトル要素
    const problemTitle = document.getElementById('problem-title');
    problemTitle.textContent = `${year}年 ${japaneseSubjectName}`;

    // HTML要素の参照
    const questionText = document.getElementById("question-text");
    const choicesList = document.getElementById("choices-list");
    const questionImage = document.getElementById("question-image");
    const answerText = document.getElementById("answer-text");
    const answerImage = document.getElementById("answer-image");
    const answerBtn = document.getElementById("answer-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const currentNumber = document.getElementById("current-number");
    const totalNumber = document.getElementById("total-number");
    const progressBar = document.getElementById("progress-bar");
    const progressRatio = document.getElementById("progress-ratio");
    const languageSelect = document.getElementById("language-select");
    const backButton = document.getElementById("back-btn");

    // ★ 自前モーダルの要素
    const resumeDialogOverlay = document.getElementById("resume-dialog");
    const resumeContinueBtn = document.getElementById("resume-continue-btn");
    const resumeNewstartBtn = document.getElementById("resume-newstart-btn");
    const resumeGobackBtn = document.getElementById("resume-goback-btn");

    // ストレージ保存用キー
    const storageKey = `practiceProgress_${year}_${part}_${subject}`;

    // 言語を保持
    let currentLanguage = 'ja'; // 初期値

    // 問題データ＆進捗管理
    let questions = [];
    let currentQuestionIndex = 0;

    // 1) 前回データがあるかどうかチェック
    const savedData = localStorage.getItem(storageKey);

    // 2) 問題データをロード → 成功したら、前回データがあればモーダルを表示
    loadQuestions().then(() => {
        if (savedData) {
            // モーダルを表示
            resumeDialogOverlay.classList.add("show");
        }
    }).catch(err => {
        console.error(err);
    });

    // ================== loadQuestions =====================
    async function loadQuestions() {
        const dataUrl = `${repositoryName}/data/${year}/part${part}/${subject}.json`;
        const response = await fetch(dataUrl);
        if (!response.ok) {
            throw new Error(`サーバーエラー: ${response.statusText}`);
        }
        questions = await response.json();
        if (questions.length === 0) {
            throw new Error('問題データがありません。');
        }
        // 全問題数を表示
        totalNumber.textContent = questions.length;

        // まだ currentQuestionIndex は0のまま（新規スタート想定）
        displayQuestion();
    }

    // ================== displayQuestion ====================
    function displayQuestion() {
        if (questions.length === 0) {
            questionText.textContent = '問題が見つかりません。';
            return;
        }
        const q = questions[currentQuestionIndex];
        // 多言語なら q.question[currentLanguage] を使う
        if (q.question && typeof q.question === 'object') {
            questionText.textContent = q.question[currentLanguage] || '問題文がありません。';
        } else {
            // 1言語だけの場合
            questionText.textContent = q.question || '問題文がありません。';
        }

        // 選択肢
        choicesList.innerHTML = '';
        if (q.choices) {
            for (const [key, value] of Object.entries(q.choices)) {
                const li = document.createElement('li');
                // 多言語かどうか
                if (value && typeof value === 'object') {
                    li.textContent = `${key}: ${value[currentLanguage] || '---'}`;
                } else {
                    li.textContent = `${key}: ${value}`;
                }
                choicesList.appendChild(li);
            }
        }

        // 問題画像
        if (q.image) {
            questionImage.src = `${repositoryName}/images/${q.image}.png`;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }

        // 解答表示リセット
        answerText.style.display = 'none';
        answerText.textContent = '';
        answerImage.style.display = 'none';
        answerBtn.disabled = false;

        // 現在の問題番号を表示（1-based）
        currentNumber.textContent = currentQuestionIndex + 1;

        // ナビゲーション
        prevBtn.disabled = (currentQuestionIndex === 0);
        nextBtn.disabled = (currentQuestionIndex === questions.length - 1);

        // 進捗バー
        progressBar.value = currentQuestionIndex + 1;
        progressBar.max = questions.length;
        const percent = Math.round(((currentQuestionIndex+1)/questions.length)*100);
        progressRatio.textContent = `${percent}%`;
    }

    // ================== showAnswer ====================
    answerBtn.addEventListener("click", function() {
        const q = questions[currentQuestionIndex];
        answerText.style.display = 'block';

        // 正解が配列なら全て表示
        if (Array.isArray(q.answer)) {
            const correctAnswers = q.answer.join(', ');
            // 多言語の解説
            if (q.explanation && typeof q.explanation === 'object') {
                answerText.innerHTML = `正解：${correctAnswers}<br>${q.explanation[currentLanguage] || '解説がありません。'}`;
            } else {
                answerText.innerHTML = `正解：${correctAnswers}<br>${q.explanation || '解説がありません。'}`;
            }
        } else {
            // 単一の答え
            if (q.explanation && typeof q.explanation === 'object') {
                answerText.innerHTML = `正解：${q.answer}<br>${q.explanation[currentLanguage] || '解説がありません。'}`;
            } else {
                answerText.innerHTML = `正解：${q.answer}<br>${q.explanation || '解説がありません。'}`;
            }
        }

        // 解答画像
        if (q.answerImage) {
            answerImage.src = `${repositoryName}/images/${q.answerImage}.png`;
            answerImage.style.display = 'block';
        }

        // ボタン無効化
        answerBtn.disabled = true;
    });

    // ================== next / prev ====================
    nextBtn.addEventListener("click", function() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        }
    });
    prevBtn.addEventListener("click", function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    });

    // ================== 言語切り替え ====================
    languageSelect.addEventListener("change", function() {
        currentLanguage = languageSelect.value;
        displayQuestion();
    });

    // ================== 戻るボタン ====================
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

    // ================== 自前モーダルのボタン処理 ====================
    // 「前回の続き」ボタン
    resumeContinueBtn.addEventListener("click", function() {
        // localStorage のデータを復元
        const parsed = JSON.parse(localStorage.getItem(storageKey));
        if (parsed && parsed.currentIndex != null) {
            currentQuestionIndex = parsed.currentIndex;
        }
        // モーダルを閉じる
        resumeDialogOverlay.classList.remove("show");
        displayQuestion();
    });

    // 「新規スタート」ボタン
    resumeNewstartBtn.addEventListener("click", function() {
        // 前回データ削除
        localStorage.removeItem(storageKey);
        currentQuestionIndex = 0;
        // モーダルを閉じる
        resumeDialogOverlay.classList.remove("show");
        displayQuestion();
    });

    // 「科目選択ページへ戻る」ボタン
    resumeGobackBtn.addEventListener("click", function() {
        // 戻る先を指定
        window.location.href = `${repositoryName}/index.html`;
    });

    // ================== 以下、必要なら進捗を保存するロジック ====================
    // 例: 次へ / 前へ押す度に保存
    function saveProgress() {
        const dataToSave = {
            currentIndex: currentQuestionIndex,
            timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
    nextBtn.addEventListener("click", saveProgress);
    prevBtn.addEventListener("click", saveProgress);
    // 解答ボタン押下でも保存しておきたいなら
    // answerBtn.addEventListener("click", saveProgress);
});
