document.addEventListener("DOMContentLoaded", function() {
    // ★ 変更点 ★
    // GitHub Pages + 独自ドメインで、data/ や images/ がドメイン直下なら空文字にする
    const repositoryName = '';

    // URLからパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const year = urlParams.get('year');
    const part = urlParams.get('part');
    const subject = urlParams.get('subject');

    // 科目名を日本語に変換するマッピング
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
        // 必要に応じて他の科目を追加
    };

    // 科目名を日本語で取得
    const japaneseSubjectName = subjectNames[subject] || '未知の科目';

    // <h1>のテキストを更新
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

    // 進捗表示用の要素
    const currentNumber = document.getElementById("current-number");
    const totalNumber = document.getElementById("total-number");
    const progressBar = document.getElementById("progress-bar");
    const progressRatio = document.getElementById("progress-ratio");

    // ★ 言語セレクトの要素
    const languageSelect = document.getElementById("language-select");

    // 要素の存在確認
    if (
        !problemTitle ||
        !questionText ||
        !choicesList ||
        !questionImage ||
        !answerText ||
        !answerImage ||
        !answerBtn ||
        !prevBtn ||
        !nextBtn ||
        !currentNumber ||
        !totalNumber ||
        !progressBar ||
        !progressRatio ||
        !languageSelect
    ) {
        alert('必要な要素が見つかりません。ページの構造を確認してください。');
        return;
    }

    // ★ 現在の言語を保持（デフォルトは日本語）
    let currentLanguage = 'ja';

    let questions = []; // 問題データを格納する配列
    let currentQuestionIndex = 0; // 現在の問題番号を追跡

    // 問題データを読み込む関数
    async function loadQuestions() {
        try {
            // JSONファイルを取得
            const response = await fetch(`${repositoryName}/data/${year}/part${part}/${subject}.json`);
            if (!response.ok) {
                throw new Error(`サーバーエラー: ${response.statusText}`);
            }
            questions = await response.json();
            if (questions.length === 0) {
                throw new Error('問題データがありません。');
            }

            // 全問題数を表示
            totalNumber.textContent = questions.length;

            // 最初の問題を表示
            displayQuestion();
        } catch (error) {
            console.error(error);
            alert(`問題データの読み込みに失敗しました: ${error.message}`);
        }
    }

    // 問題を表示する関数
    function displayQuestion() {
        if (questions.length > 0) {
            const currentQuestion = questions[currentQuestionIndex];

            // ★ question が多言語対応の場合 (例: question["ja"], question["en"], question["zh"] など)
            //   「currentQuestion.question」がオブジェクトなら、currentQuestion.question[currentLanguage]を参照
            if (currentQuestion.question && typeof currentQuestion.question === 'object') {
                questionText.textContent =
                  currentQuestion.question[currentLanguage] || '問題文がありません。';
            } else {
                // 従来通りの1言語のみの場合はこちらを使用
                questionText.textContent =
                  currentQuestion.question || '問題文がありません。';
            }

            // 選択肢の表示（多言語対応の場合）
            choicesList.innerHTML = '';
            if (currentQuestion.choices) {
                // choices が {a: {ja:xxx, en:yyy}, b: {...}, ...} のようなオブジェクトの場合
                for (const [key, value] of Object.entries(currentQuestion.choices)) {
                    const li = document.createElement('li');

                    // もし value が多言語オブジェクトなら対応する言語を表示
                    if (value && typeof value === 'object') {
                        li.textContent = `${key}: ${value[currentLanguage] || '---'}`;
                    } else {
                        // 1言語のみならそのまま
                        li.textContent = `${key}: ${value}`;
                    }
                    choicesList.appendChild(li);
                }
            }

            // 問題の画像を表示
            if (currentQuestion.image) {
                questionImage.src = `${repositoryName}/images/${currentQuestion.image}.png`;
                questionImage.style.display = 'block';
            } else {
                questionImage.style.display = 'none';
            }

            // 解答と解答の画像を非表示に
            answerText.style.display = "none";
            answerText.textContent = "";
            answerImage.style.display = 'none';

            // 現在の問題番号を表示 (1-based)
            currentNumber.textContent = currentQuestionIndex + 1;

            // ナビゲーションボタンの状態を更新
            prevBtn.disabled = (currentQuestionIndex === 0);
            nextBtn.disabled = (currentQuestionIndex === questions.length - 1);
            answerBtn.disabled = false;

            // 進捗バーの更新
            progressBar.value = currentQuestionIndex + 1;  
            progressBar.max = questions.length;
            const percentage = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
            progressRatio.textContent = percentage + "%";
        } else {
            // 問題データが空の場合
            questionText.textContent = '問題が見つかりません。';
            answerBtn.disabled = true;
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    // 解答を表示する
    answerBtn.addEventListener("click", function() {
        const currentQuestion = questions[currentQuestionIndex];
        answerText.style.display = "block";

        // 正解が配列の場合は全て列挙
        if (Array.isArray(currentQuestion.answer)) {
            const correctAnswers = currentQuestion.answer.join(', ');
            // 解説を言語別に持っている想定の場合:
            if (currentQuestion.explanation && typeof currentQuestion.explanation === 'object') {
                answerText.innerHTML = `正解：${correctAnswers}<br>${currentQuestion.explanation[currentLanguage] || '解説がありません。'}`;
            } else {
                // 1言語のみ
                answerText.innerHTML = `正解：${correctAnswers}<br>${currentQuestion.explanation || '解説がありません。'}`;
            }
        } else {
            // 単一の答え
            if (currentQuestion.explanation && typeof currentQuestion.explanation === 'object') {
                answerText.innerHTML = `正解：${currentQuestion.answer}<br>${currentQuestion.explanation[currentLanguage] || '解説がありません。'}`;
            } else {
                answerText.innerHTML = `正解：${currentQuestion.answer}<br>${currentQuestion.explanation || '解説がありません。'}`;
            }
        }

        // 解答の画像を表示
        if (currentQuestion.answerImage) {
            answerImage.src = `${repositoryName}/images/${currentQuestion.answerImage}.png`;
            answerImage.style.display = 'block';
        } else {
            answerImage.style.display = 'none';
        }

        // 解答ボタンを無効化
        answerBtn.disabled = true;
    });

    // 次の問題に移動
    nextBtn.addEventListener("click", function() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        }
    });

    // 前の問題に移動
    prevBtn.addEventListener("click", function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    });

    // 戻るリンク設定
    const backButton = document.getElementById("back-btn");
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

    // ★ セレクトボックスの変更イベント
    languageSelect.addEventListener("change", function() {
        currentLanguage = languageSelect.value; // ja, en, zh のいずれか
        // 言語を切り替えた状態で問題を再描画
        displayQuestion();
    });

    // 初期化：問題データを読み込む
    loadQuestions();
});
