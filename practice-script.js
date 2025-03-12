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

    // 各種要素のID参照
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

    // ★★★ 新規追加: 3択モーダル (前回続き / 新規 / 戻る)
    const resumeDialog = document.getElementById('resume-dialog');
    const resumeContinueBtn = document.getElementById('resume-continue-btn');
    const resumeNewstartBtn = document.getElementById('resume-newstart-btn');
    const resumeGobackBtn = document.getElementById('resume-goback-btn');

    // 問題データ格納用
    let questions = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];

    // localStorage キー
    const storageKey = `similarPracticeProgress-${category}-${subject}`;

    // タイトルをセット
    if (practiceTitle) {
        practiceTitle.textContent = `類似問題演習 - ${japaneseSubjectName}`;
    }

    // ======= 問題を読み込む =======
    async function loadQuestions() {
        try {
            // JSONデータのパス
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

            // ここで前回の進捗があるか確認（confirmは使わない）
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                // 前回の進捗データがある → カスタムモーダルを表示
                // （モーダルをフェードインしたいならクラス付けでもOK）
                resumeDialog.style.display = 'flex';
            } else {
                // 前回進捗が無い場合はそのまま問題表示開始
                updateQuestionNav();
                displayQuestion();
            }

        } catch (err) {
            console.error(err);
            alert(`問題データの読み込みに失敗しました: ${err.message}`);
        }
    }

    // ======= 3択モーダルのボタン処理 =======
    // 前回の続き
    resumeContinueBtn.addEventListener('click', () => {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            currentQuestionIndex = parsedData.currentQuestionIndex || 0;
            userAnswers = parsedData.userAnswers || [];
        }
        // モーダルを閉じる
        resumeDialog.style.display = 'none';
        // 問題表示
        updateQuestionNav();
        displayQuestion();
    });

    // 新規スタート
    resumeNewstartBtn.addEventListener('click', () => {
        // 前回進捗を消してゼロから始める
        localStorage.removeItem(storageKey);
        currentQuestionIndex = 0;
        userAnswers = [];

        resumeDialog.style.display = 'none';
        updateQuestionNav();
        displayQuestion();
    });

    // 科目選択ページに戻る
    resumeGobackBtn.addEventListener('click', () => {
        window.location.href = `${repositoryName}/similar-practice.html`;
    });


    // ======= 問題番号ナビゲーションを更新 =======
    function updateQuestionNav() {
        if (!questionNavContainer) return;
        questionNavContainer.innerHTML = '';

        for (let i = 0; i < questions.length; i++) {
            const btn = document.createElement('button');
            btn.classList.add('question-btn');
            btn.textContent = i + 1;

            // 解答済みかどうか
            if (userAnswers[i]) {
                btn.classList.add('answered');
                // 正解／不正解で色分け
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

            // 問題番号クリック時
            btn.addEventListener('click', () => {
                currentQuestionIndex = i;
                displayQuestion();
                updateQuestionNav();
                saveProgress();
            });

            questionNavContainer.appendChild(btn);
        }
    }

    // ======= 問題を表示する関数 =======
    function displayQuestion() {
        if (questions.length === 0) {
            // データ無し
            if (questionText) questionText.textContent = '問題が見つかりません。';
            if (answerBtn) answerBtn.disabled = true;
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        const q = questions[currentQuestionIndex];

        // 問題文
        if (questionText) {
            questionText.textContent = q.question || '問題文がありません。';
        }

        // 現在の問題番号
        if (currentNumber) {
            currentNumber.textContent = currentQuestionIndex + 1;
        }

        // 選択肢の表示をクリアして再生成
        if (choicesList) {
            choicesList.innerHTML = '';
            if (q.choices) {
                // {A: '...', B: '...'} 形式をループ
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

                    // リスト項目クリックで選択
                    li.addEventListener('click', () => {
                        input.checked = true;
                        // すべての選択スタイルをリセット
                        document.querySelectorAll('#choices-list li').forEach(liEl => {
                            liEl.classList.remove('selected');
                        });
                        li.classList.add('selected');
                    });

                    choicesList.appendChild(li);
                });
            }
        }

        // フィードバック/解説をリセット
        if (feedbackText) {
            feedbackText.style.display = 'none';
            feedbackText.textContent = '';
        }
        if (explanationText) {
            explanationText.style.display = 'none';
            explanationText.textContent = '';
        }

        // ボタン状態を更新
        if (prevBtn) {
            prevBtn.disabled = (currentQuestionIndex === 0);
        }
        if (nextBtn) {
            nextBtn.disabled = true; // 解答する前は「次へ」押せない
        }
        if (answerBtn) {
            answerBtn.disabled = false;
        }
        if (finishBtn) {
            finishBtn.style.display = 'none'; // 最終問題まで隠す
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

            // 解答を保存
            userAnswers[currentQuestionIndex] = {
                userAnswer,
                correctAnswer,
                isCorrect
            };

            // フィードバック表示
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

            // 「次へ」ボタンの活性／非活性
            if (nextBtn) {
                nextBtn.disabled = (currentQuestionIndex === questions.length - 1);
            }
            // 最終問題なら「結果を表示」ボタンを出す
            if (finishBtn && currentQuestionIndex === questions.length - 1) {
                finishBtn.style.display = 'inline-block';
            }

            // 解答送信ボタンは1回のみ有効
            answerBtn.disabled = true;

            // 保存＆ナビゲーション更新
            saveProgress();
            updateQuestionNav();
        });
    }

    // ======= 次の問題へ =======
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            // 10問ごとにモーダルを表示（最後の問題には到達していない場合）
            if ((currentQuestionIndex + 1) % 10 === 0 && currentQuestionIndex < questions.length - 1) {
                showPartialScoreModal();
            }

            // 次の問題を表示
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

        // 直近10問の正解率
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

        // 累計の正解率
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

        // モーダル内の表示テキスト
        if (scoreDetails) {
            scoreDetails.innerHTML = `
              <p>直近 (${startIndex+1}～${endIndex+1} 問目) 正答率: ${recentRate}%<br>
              累計正答率: ${totalRate}%</p>
            `;
        }

        // Chart.js によるグラフ描画
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
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // モーダルをフェードイン表示
        partialScoreModal.style.display = 'flex';
        partialScoreModal.classList.remove('modal-hide');
        partialScoreModal.classList.add('modal-show');
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

            // 問題セクションを隠して結果セクションを表示
            document.getElementById('question-section').style.display = 'none';
            resultSection.style.display = 'block';

            // 完了したらストレージを削除
            localStorage.removeItem(storageKey);
        });
    }

    // ======= もう一度やり直す =======
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

    // ======= 進捗をlocalStorageに保存 =======
    function saveProgress() {
        const dataToSave = {
            currentQuestionIndex,
            userAnswers
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }

    // ======= モーダルの閉じるボタンイベント =======
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            closeModalWithFadeOut();
        });
    }
    if (closeScoreBtn) {
        closeScoreBtn.addEventListener('click', () => {
            closeModalWithFadeOut();
        });
    }

    // ======= モーダルをフェードアウトして閉じる関数 =======
    function closeModalWithFadeOut() {
        partialScoreModal.classList.remove('modal-show');
        partialScoreModal.classList.add('modal-hide');

        // 0.3秒後に display: none; で完全に非表示
        setTimeout(() => {
            partialScoreModal.style.display = 'none';
            partialScoreModal.classList.remove('modal-hide');
        }, 300);
    }

    // ======= 実行 =======
    loadQuestions();
});
