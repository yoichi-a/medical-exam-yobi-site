document.addEventListener("DOMContentLoaded", function() {
    // リポジトリ名を設定（あなたのリポジトリ名に合わせて変更してください）
    const repositoryName = '/medical-exam-yobi-site';

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

    // 要素の存在確認
    if (!problemTitle || !questionText || !choicesList || !questionImage || !answerText || !answerImage || !answerBtn || !prevBtn || !nextBtn || !currentNumber || !totalNumber) {
        alert('必要な要素が見つかりません。ページの構造を確認してください。');
        return;
    }

    let questions = []; // 問題データを格納する配列
    let currentQuestionIndex = 0; // 現在の問題番号を追跡

    // 問題データを読み込む関数
    async function loadQuestions() {
        try {
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
            questionText.textContent = currentQuestion.question || '問題文がありません。';

            // 選択肢の表示
            choicesList.innerHTML = '';
            if (currentQuestion.choices) {
                for (const [key, value] of Object.entries(currentQuestion.choices)) {
                    const li = document.createElement('li');
                    li.textContent = `${key}: ${value}`;
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

            // ボタンの状態を更新
            prevBtn.disabled = currentQuestionIndex === 0;
            nextBtn.disabled = currentQuestionIndex === questions.length - 1;
            answerBtn.disabled = false; // 解答ボタンを有効化

            // 現在の問題番号を更新
            currentNumber.textContent = currentQuestionIndex + 1;

        } else {
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
        if (Array.isArray(currentQuestion.answer)) {
            const correctAnswers = currentQuestion.answer.join(', ');
            answerText.innerHTML = `正解：${correctAnswers}<br>${currentQuestion.explanation || '解説がありません。'}`;
        } else {
            answerText.innerHTML = `正解：${currentQuestion.answer}<br>${currentQuestion.explanation || '解説がありません。'}`;
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

    // 初期化：問題データを読み込む
    loadQuestions();
});
