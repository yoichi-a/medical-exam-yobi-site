document.addEventListener("DOMContentLoaded", function() {
    // GitHub Pages + 独自ドメイン用のパス指定 (空文字でもOK)
    const repositoryName = '';

    // URLパラメータ取得
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'basic';
    const subject = urlParams.get('subject') || 'anatomy';

    // 科目名マッピング
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
    const japaneseSubjectName = subjectNames[subject] || '未知の科目';

    // ID参照
    const practiceTitle = document.getElementById('practice-title');
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
    const questionNavContainer = document.getElementById("question-nav");

    // 部分スコア表示用モーダル
    const partialScoreModal = document.getElementById('partial-score-modal');
    const modalClose = document.getElementById('modal-close');
    const closeScoreBtn = document.getElementById('closeScoreBtn');
    const scoreDetails = document.getElementById('scoreDetails');
    let partialScoreChart = null;

    // 問題データ
    let questions = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];

    // localStorageキー
    const storageKey = `similarPracticeProgress-${category}-${subject}`;

    // タイトル
    if (practiceTitle) {
        practiceTitle.textContent = `類似問題演習 - ${japaneseSubjectName}`;
    }

    // ======= 問題を読み込む =======
    async function loadQuestions() {
        try {
            const dataUrl = `${repositoryName}/data/similar/${category}/${subject}.json`;
            const response = await fetch(dataUrl);
            if (!response.ok) {
                throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
            }
            questions = await response.json();
            if (questions.length === 0) {
                throw new Error('問題データが空です。');
            }

            // 問題数を表示
            if (totalNumber) {
                totalNumber.textContent = questions.length;
            }

            // 進捗があれば復元
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                if (confirm("前回の続きから再開しますか？")) {
                    const parsedData = JSON.parse(savedData);
                    currentQuestionIndex = parsedData.currentQuestionIndex || 0;
                    userAnswers = parsedData.userAnswers || [];
                }
            }

            updateQuestionNav();
            displayQuestion();
        } catch (err) {
            console.error(err);
            alert(`問題データの読み込みに失敗しました: ${err.message}`);
        }
    }

    // ======= 問題番号ナビゲーションを更新 =======
    function updateQuestionNav() {
        if (!questionNavContainer) return;
        questionNavContainer.innerHTML = '';

        for (let i = 0; i < questions.length; i++) {
            const btn = document.createElement('button');
            btn.classList.add('question-btn');
            btn.textContent = i + 1;

            if (userAnswers[i]) {
                // 何らかの回答がある
                btn.classList.add('answered');
                // 正解/不正解で色分け
                const { userAnswer, correctAnswer } = userAnswers[i];
                const isCorrect = (userAnswer === correctAnswer);
                if (isCorrect) {
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('incorrect');
                }
            }

            // 現在の問題を強調
            if (i === currentQuestionIndex) {
                btn.classList.add('current');
            }

            btn.addEventListener('click', () => {
                currentQuestionIndex = i;
                displayQuestion();
                updateQuestionNav();
                saveProgress();
            });
            questionNavContainer.appendChild(btn);
        }
    }

    // ======= 問題を表示 =======
    function displayQuestion() {
        if (questions.length === 0) {
            if (questionText) questionText.textContent = '問題が見つかりません。';
            if (answerBtn) answerBtn.disabled = true;
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        const q = questions[currentQuestionIndex];
        if (questionText) {
            questionText.textContent = q.question || '問題文がありません。';
        }
        if (currentNumber) {
            currentNumber.textContent = currentQuestionIndex + 1;
        }

        if (choicesList) {
            choicesList.innerHTML = '';
            if (q.choices) {
                // choicesが{A: '...',B: '...'}の形式の場合
                Object.entries(q.choices).forEach(([key, value]) => {
                    const li = document.createElement('li');
                    li.classList.add('choice-item');

                    const label = document.createElement('label');
                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = 'choice';
                    input.value = key;

                    label.appendChild(input);
                    label.appendChild(document.createTextNode(`${key}: ${value}`));
                    li.appendChild(label);

                    // liをクリックすると選択
                    li.addEventListener('click', () => {
                        input.checked = true;
                        document.querySelectorAll('#choices-list li').forEach(liEl => {
                            liEl.classList.remove('selected');
                        });
                        li.classList.add('selected');
                    });
                    choicesList.appendChild(li);
                });
            }
        }

        // フィードバック/解説リセット
        if (feedbackText) {
            feedbackText.style.display = 'none';
            feedbackText.textContent = '';
        }
        if (explanationText) {
            explanationText.style.display = 'none';
            explanationText.textContent = '';
        }

        // ボタン制御
        if (prevBtn) {
            prevBtn.disabled = (currentQuestionIndex === 0);
        }
        if (nextBtn) {
            nextBtn.disabled = true; // 解答前は進めない
        }
        if (answerBtn) {
            answerBtn.disabled = false;
        }
        if (finishBtn) {
            finishBtn.style.display = 'none';
        }
    }

    // ======= 解答を送信 =======
    if (answerBtn) {
        answerBtn.addEventListener('click', () => {
            const q = questions[currentQuestionIndex];
            const selected = document.querySelector('input[name="choice"]:checked');
            if (!selected) {
                alert('選択肢を選んでください。');
                return;
            }
            const userAnswer = selected.value;
            const correctAnswer = q.answer;
            const isCorrect = (userAnswer === correctAnswer);

            // 答えを保存
            userAnswers[currentQuestionIndex] = {
                userAnswer,
                correctAnswer,
                isCorrect
            };

            // フィードバック
            if (feedbackText) {
                feedbackText.style.display = 'block';
                if (isCorrect) {
                    feedbackText.textContent = '正解です！';
                    feedbackText.className = 'correct';
                } else {
                    feedbackText.textContent = `不正解です。正解は ${correctAnswer} です。`;
                    feedbackText.className = 'incorrect';
                }
            }

            // 解説表示
            if (explanationText) {
                explanationText.style.display = 'block';
                explanationText.innerHTML = q.explanation || '解説がありません。';
            }

            // 次へボタン
            if (nextBtn) {
                nextBtn.disabled = (currentQuestionIndex === questions.length - 1);
            }
            // 最終問題なら結果表示ボタン
            if (finishBtn && currentQuestionIndex === questions.length - 1) {
                finishBtn.style.display = 'inline-block';
            }

            answerBtn.disabled = true;

            // 進捗保存 & ナビゲーション更新
            saveProgress();
            updateQuestionNav();
        });
    }

    // ======= 次の問題へ =======
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            // 10問ごとにモーダル表示
            if ((currentQuestionIndex + 1) % 10 === 0 && currentQuestionIndex < questions.length - 1) {
                showPartialScoreModal();
            }

            // 次の問題へ
            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                displayQuestion();
                updateQuestionNav();
            }
            saveProgress();
        });
    }

    // ======= 前の問題へ =======
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                displayQuestion();
                updateQuestionNav();
            }
            saveProgress();
        });
    }

    // ======= 10問ごとの部分スコア (モーダル) =======
    function showPartialScoreModal() {
        const endIndex = currentQuestionIndex;
        const startIndex = Math.max(0, endIndex - 9);
        let localAnswered = 0;
        let localCorrect = 0;
        for (let i = startIndex; i <= endIndex; i++) {
            if (!userAnswers[i]) continue;
            localAnswered++;
            if (userAnswers[i].userAnswer === userAnswers[i].correctAnswer) {
                localCorrect++;
            }
        }
        const recentRate = (localAnswered > 0)
            ? ((localCorrect / localAnswered) * 100).toFixed(2)
            : 0;

        // 累計
        let totalAnswered = 0;
        let totalCorrect = 0;
        userAnswers.forEach(ans => {
            if (!ans) return;
            totalAnswered++;
            if (ans.userAnswer === ans.correctAnswer) {
                totalCorrect++;
            }
        });
        const totalRate = (totalAnswered > 0)
            ? ((totalCorrect / totalAnswered) * 100).toFixed(2)
            : 0;

        // モーダル内のテキスト
        if (scoreDetails) {
            scoreDetails.innerHTML = `
              <p>直近 (${startIndex+1}～${endIndex+1} 問目) 正答率: ${recentRate}%<br>
              累計正答率: ${totalRate}%</p>
            `;
        }

        // Chart.js で描画
        const ctx = document.getElementById('scoreChart').getContext('2d');
        if (partialScoreChart) {
            partialScoreChart.destroy();
        }
        partialScoreChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['直近10問', '累計'],
                datasets: [{
                    label: '正答率(%)',
                    data: [Number(recentRate), Number(totalRate)],
                    backgroundColor: ['#4caf50','#2196f3']
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });

        partialScoreModal.style.display = 'block';
    }

    // ======= 結果を表示 =======
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            let correctCount = 0;
            userAnswers.forEach(ans => {
                if (ans && ans.userAnswer === ans.correctAnswer) {
                    correctCount++;
                }
            });
            const total = questions.length;
            const accuracy = ((correctCount / total) * 100).toFixed(2);

            correctCountElement.textContent = correctCount;
            totalQuestionsElement.textContent = total;
            accuracyElement.textContent = accuracy;

            document.getElementById('question-section').style.display = 'none';
            resultSection.style.display = 'block';

            // 完了したらストレージを削除
            localStorage.removeItem(storageKey);
        });
    }

    // ======= やり直し =======
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            currentQuestionIndex = 0;
            userAnswers = [];
            localStorage.removeItem(storageKey);

            resultSection.style.display = 'none';
            document.getElementById('question-section').style.display = 'block';
            displayQuestion();
            updateQuestionNav();
        });
    }

    // ======= 戻るボタン =======
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', () => {
            window.location.href = `${repositoryName}/similar-practice.html`;
        });
    }
    if (backButton) {
        backButton.onclick = function() {
            window.location.href = `${repositoryName}/similar-practice.html`;
        };
    }

    // ======= ストレージ保存 =======
    function saveProgress() {
        const dataToSave = {
            currentQuestionIndex,
            userAnswers
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }

    // ======= モーダル操作 =======
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            partialScoreModal.style.display = 'none';
        });
    }
    if (closeScoreBtn) {
        closeScoreBtn.addEventListener('click', () => {
            partialScoreModal.style.display = 'none';
        });
    }

    // ======= 実行 =======
    loadQuestions();
});
