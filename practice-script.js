// practice-script.js

document.addEventListener("DOMContentLoaded", function() {
    const repositoryName = '/medical-exam-yobi-site'; // 実際の構成に合わせて修正

    // URLからパラメータを取得し、デフォルト値を設定
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'basic';     // 例: 'basic'
    const subject = urlParams.get('subject') || 'anatomy';     // 例: 'anatomy'

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
    if (practiceTitle) {
        practiceTitle.textContent = `類似問題演習 - ${japaneseSubjectName}`;
    }

    // HTML要素の参照
    const questionText = document.getElementById("question-text");
    const choicesList = document.getElementById("choices-list");
    const answerBtn = document.getElementById("submit-answer-btn");
    const feedbackText = document.getElementById("feedback-text");
    const explanationText = document.getElementById("explanation-text");
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
    const backButton = document.getElementById("back-btn");

    let questions = [];              // 問題データ
    let currentQuestionIndex = 0;    // 今の問題番号(0-based)
    let userAnswers = [];            // ユーザーの解答を記録

    // localStorageキー (カテゴリー＆科目別に保持)
    const storageKey = `similarPracticeProgress-${category}-${subject}`;

    // ======== 問題データを読み込む関数 ========
    async function loadQuestions() {
        try {
            // JSONファイルのパスを組み立て
            const dataUrl = `${repositoryName}/data/similar/${category}/${subject}.json`;
            const response = await fetch(dataUrl);
            if (!response.ok) {
                throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
            }
            questions = await response.json();
            if (questions.length === 0) {
                throw new Error('問題データが空です。');
            }

            // ※ シャッフルしないで、そのままの順序で扱う
            // shuffleArray(questions); // ← コメントアウト

            // トータル問題数を表示
            if (totalNumber) {
                totalNumber.textContent = questions.length;
            }

            // ===== localStorageに進捗データがあれば復元するか確認 =====
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                if (confirm("前回の続きから再開しますか？")) {
                    const parsedData = JSON.parse(savedData);
                    currentQuestionIndex = parsedData.currentQuestionIndex || 0;
                    userAnswers = parsedData.userAnswers || [];
                }
            }

            displayQuestion();
        } catch (error) {
            console.error(error);
            alert(`問題データの読み込みに失敗しました: ${error.message}`);
        }
    }

    // ======== 問題を表示する関数 ========
    function displayQuestion() {
        // 問題が無いとき
        if (questions.length === 0) {
            if (questionText) questionText.textContent = '問題が見つかりません。';
            if (answerBtn) answerBtn.disabled = true;
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        // 現在の問題を取得
        const q = questions[currentQuestionIndex];

        // 問題文をセット
        if (questionText) {
            questionText.textContent = q.question || '問題文がありません。';
        }

        // 何問目か表示 (1-based)
        if (currentNumber) {
            currentNumber.textContent = (currentQuestionIndex + 1);
        }

        // 選択肢を描画
        if (choicesList) {
            choicesList.innerHTML = '';
            if (q.choices) {
                for (const [key, value] of Object.entries(q.choices)) {
                    const li = document.createElement('li');
                    const label = document.createElement('label');
                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = 'choice';
                    input.value = key;
                    label.appendChild(input);
                    label.appendChild(document.createTextNode(`${key}: ${value}`));
                    li.appendChild(label);
                    choicesList.appendChild(li);
                }
            }
        }

        // フィードバックや解説は非表示
        if (feedbackText) {
            feedbackText.style.display = 'none';
            feedbackText.textContent = '';
        }
        if (explanationText) {
            explanationText.style.display = 'none';
            explanationText.textContent = '';
        }

        // 前・次・解答ボタンの状態
        if (prevBtn) {
            prevBtn.disabled = (currentQuestionIndex === 0);
        }
        if (nextBtn) {
            nextBtn.disabled = true;  // 解答するまでは押せない
        }
        if (answerBtn) {
            answerBtn.disabled = false;
        }
        if (finishBtn) {
            finishBtn.style.display = 'none';
        }
    }

    // ======== 解答を送信する ========
    if (answerBtn) {
        answerBtn.addEventListener("click", function() {
            const q = questions[currentQuestionIndex];
            // ラジオボタンの選択を確認
            const selectedOption = document.querySelector('input[name="choice"]:checked');
            if (!selectedOption) {
                alert('選択肢を選んでください。');
                return;
            }
            const userAnswer = selectedOption.value;
            const correctAnswer = q.answer;

            // 記録
            userAnswers[currentQuestionIndex] = {
                userAnswer,
                correctAnswer
            };

            // フィードバック (正誤表示)
            if (feedbackText) {
                feedbackText.textContent = (userAnswer === correctAnswer)
                    ? '正解です！'
                    : `不正解です。正解は ${correctAnswer} です。`;
                feedbackText.style.display = 'block';
            }

            // 解説表示
            if (explanationText) {
                explanationText.style.display = 'block';
                explanationText.innerHTML = q.explanation || '解説がありません。';
            }

            // 次の問題 or 結果表示ボタン
            if (answerBtn) answerBtn.disabled = true;
            if (nextBtn) {
                nextBtn.disabled = (currentQuestionIndex === questions.length - 1);
            }
            if (finishBtn && currentQuestionIndex === questions.length - 1) {
                finishBtn.style.display = 'inline-block';
            }

            // 進捗保存
            saveProgress();
        });
    }

    // ======== 次の問題へ ========
    if (nextBtn) {
        nextBtn.addEventListener("click", function() {
            // 10問ごとに部分採点 (10,20,30,...)
            if ((currentQuestionIndex + 1) % 10 === 0) {
                doPartialScore();
            }

            // 次の問題へ
            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                displayQuestion();
            }

            // 進捗保存
            saveProgress();
        });
    }

    // ======== 前の問題へ ========
    if (prevBtn) {
        prevBtn.addEventListener("click", function() {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                displayQuestion();
            }
            // 進捗保存
            saveProgress();
        });
    }

    // ======== 10問ごとに部分採点する関数 ========
    function doPartialScore() {
        // 例: currentQuestionIndexが9なら1~10問目の部分採点
        const endIndex = currentQuestionIndex;
        const startIndex = endIndex - 9 >= 0 ? endIndex - 9 : 0;
        let correctCount = 0;
        let answeredCount = 0;

        for (let i = startIndex; i <= endIndex; i++) {
            if (!userAnswers[i]) continue; // 未回答スキップ
            answeredCount++;
            if (userAnswers[i].userAnswer === userAnswers[i].correctAnswer) {
                correctCount++;
            }
        }

        alert(`問題 ${startIndex + 1}～${endIndex + 1} の部分採点：\n${correctCount}問正解 / ${answeredCount}問回答`);
    }

    // ======== 結果を表示 ========
    if (finishBtn) {
        finishBtn.addEventListener("click", function() {
            showResults();
        });
    }

    function showResults() {
        let correctCount = 0;
        userAnswers.forEach((ans) => {
            if (ans && ans.userAnswer === ans.correctAnswer) {
                correctCount++;
            }
        });
        const total = questions.length;
        const accuracy = ((correctCount / total) * 100).toFixed(2);

        if (correctCountElement) correctCountElement.textContent = correctCount;
        if (totalQuestionsElement) totalQuestionsElement.textContent = total;
        if (accuracyElement) accuracyElement.textContent = accuracy;

        // 問題セクションを非表示、結果セクションを表示
        document.getElementById('question-section').style.display = 'none';
        if (resultSection) {
            resultSection.style.display = 'block';
        }

        // 進捗データは削除 (一旦終了)
        localStorage.removeItem(storageKey);
    }

    // ======== もう一度やり直す ========
    if (retryBtn) {
        retryBtn.addEventListener("click", function() {
            currentQuestionIndex = 0;
            userAnswers = [];

            // localStorage削除
            localStorage.removeItem(storageKey);

            if (resultSection) resultSection.style.display = 'none';
            document.getElementById('question-section').style.display = 'block';
            displayQuestion();
        });
    }

    // ======== 科目選択ページに戻る ========
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener("click", function() {
            window.location.href = `${repositoryName}/similar-practice.html`;
        });
    }

    // ======== 戻るボタン ========
    if (backButton) {
        backButton.onclick = function() {
            window.location.href = `${repositoryName}/similar-practice.html`;
        };
    }

    // ======== 進捗をlocalStorageへ保存 ========
    function saveProgress() {
        const dataToSave = {
            currentQuestionIndex,
            userAnswers,
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }

    // ======== 実行（問題データ読み込み） ========
    loadQuestions();
});
