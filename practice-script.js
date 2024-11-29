document.addEventListener("DOMContentLoaded", function() {
    const repositoryName = '/medical-exam-yobi-site';

    // URLからパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category'); // 'basic' または 'clinical'
    const subject = urlParams.get('subject');

    // 科目名を日本語に変換するマッピング
    const subjectNames = {
        anatomy: '解剖学',
        physiology: '生理学',
        biochemistry: '生化学',
        pharmacology: '薬理学',
        pathology: '病理学',
        immunology: '免疫学',
        microbiology: '微生物学',
        hygiene: '衛生学',
        forensic_medicine: '法医学',
        internal_medicine: '内科学',
        surgery: '外科学',
        pediatrics: '小児科学',
        psychiatry: '精神科学',
        orthopedics: '整形外科学',
        obstetrics_gynecology: '産科・婦人科学',
        dermatology: '皮膚科学',
        urology: '泌尿器科学',
        otorhinolaryngology: '耳鼻咽喉科学',
        ophthalmology: '眼科学',
        radiology: '放射線科学',
        emergency_medicine: '救急医学'
    };

    // 科目名を日本語で取得
    const japaneseSubjectName = subjectNames[subject] || '未知の科目';

    // タイトルを更新
    const practiceTitle = document.getElementById('practice-title');
    practiceTitle.textContent = `類似問題演習 - ${japaneseSubjectName}`;

    // HTML要素の参照
    const questionText = document.getElementById("question-text");
    const choicesList = document.getElementById("choices-list");
    const answerBtn = document.getElementById("submit-answer-btn");
    const feedbackText = document.getElementById("feedback-text");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const finishBtn = document.getElementById("finish-btn");
    const currentNumber = document.getElementById("current-number");
    const totalNumber = document.getElementById("total-number");
    const resultSection = document.getElementById("result-section");
    const correctCountElement = document.getElementById("correct-count");
    const totalQuestionsElement = document.getElementById("total-questions");
    const accuracyElement = document.getElementById("accuracy");
    const retryBtn = document.getElementById("retry-btn");
    const backToSelectionBtn = document.getElementById("back-to-selection-btn");

    // 戻るボタン
    const backButton = document.getElementById("back-btn");

    let questions = []; // 問題データを格納
    let currentQuestionIndex = 0; // 現在の問題番号
    let userAnswers = []; // ユーザーの解答を記録

    // 問題データを読み込む関数
    async function loadQuestions() {
        try {
            const response = await fetch(`${repositoryName}/data/similar/${category}/${subject}.json`);
            if (!response.ok) {
                throw new Error(`サーバーエラー: ${response.statusText}`);
            }
            questions = await response.json();
            // 問題をシャッフル
            shuffleArray(questions);
            // 総問題数を設定
            totalNumber.textContent = questions.length;
            displayQuestion();
        } catch (error) {
            console.error(error);
            alert(`問題データの読み込みに失敗しました: ${error.message}`);
        }
    }

    // 配列をシャッフルする関数
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 問題を表示する関数
    function displayQuestion() {
        if (questions.length > 0) {
            const currentQuestion = questions[currentQuestionIndex];
            questionText.textContent = currentQuestion.question || '問題文がありません。';

            // 現在の問題番号を更新
            currentNumber.textContent = currentQuestionIndex + 1;

            // 選択肢の表示
            choicesList.innerHTML = '';
            if (currentQuestion.choices) {
                for (const [key, value] of Object.entries(currentQuestion.choices)) {
                    const li = document.createElement('li');
                    const label = document.createElement('label');
                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = 'choice';
                    input.value = key;
                    label.appendChild(input);
                    label.appendChild(document.createTextNode(` ${key}: ${value}`));
                    li.appendChild(label);
                    choicesList.appendChild(li);
                }
            }

            // フィードバックを非表示に
            feedbackText.style.display = "none";
            feedbackText.textContent = "";

            // ボタンの状態を更新
            prevBtn.disabled = currentQuestionIndex === 0;
            nextBtn.disabled = true;
            answerBtn.disabled = false;
            finishBtn.style.display = 'none';
        } else {
            questionText.textContent = '問題が見つかりません。';
            answerBtn.disabled = true;
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    // 解答を送信する
    answerBtn.addEventListener("click", function() {
        const currentQuestion = questions[currentQuestionIndex];
        const selectedOption = document.querySelector('input[name="choice"]:checked');

        if (!selectedOption) {
            alert('選択肢を選んでください。');
            return;
        }

        const userAnswer = selectedOption.value;
        const correctAnswer = currentQuestion.answer;

        // ユーザーの解答を記録
        userAnswers[currentQuestionIndex] = {
            userAnswer: userAnswer,
            correctAnswer: correctAnswer
        };

        // 正誤判定
        if (userAnswer === correctAnswer) {
            feedbackText.textContent = '正解です！';
        } else {
            feedbackText.textContent = `不正解です。正解は ${correctAnswer} です。`;
        }

        feedbackText.style.display = 'block';

        // ボタンの状態を更新
        answerBtn.disabled = true;
        nextBtn.disabled = currentQuestionIndex === questions.length - 1 ? true : false;

        // 最後の問題の場合、結果表示ボタンを表示
        if (currentQuestionIndex === questions.length - 1) {
            finishBtn.style.display = 'inline-block';
        }
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

    // 結果を表示
    finishBtn.addEventListener("click", function() {
        showResults();
    });

    // 結果を表示する関数
    function showResults() {
        let correctCount = 0;
        userAnswers.forEach(answer => {
            if (answer.userAnswer === answer.correctAnswer) {
                correctCount++;
            }
        });

        const totalQuestions = questions.length;
        const accuracy = ((correctCount / totalQuestions) * 100).toFixed(2);

        correctCountElement.textContent = correctCount;
        totalQuestionsElement.textContent = totalQuestions;
        accuracyElement.textContent = accuracy;

        // 問題セクションを非表示にして、結果セクションを表示
        document.getElementById('question-section').style.display = 'none';
        resultSection.style.display = 'block';
    }

    // もう一度やり直す
    retryBtn.addEventListener("click", function() {
        // 初期化
        currentQuestionIndex = 0;
        userAnswers = [];
        shuffleArray(questions);
        displayQuestion();
        resultSection.style.display = 'none';
        document.getElementById('question-section').style.display = 'block';
    });

    // 科目選択ページに戻る
    backToSelectionBtn.addEventListener("click", function() {
        window.location.href = `${repositoryName}/similar-practice.html`;
    });

    // 戻るボタンの設定
    if (backButton) {
        backButton.onclick = function() {
            window.location.href = `${repositoryName}/similar-practice.html`;
        };
    }

    // 初期化：問題データを読み込む
    loadQuestions();
});
