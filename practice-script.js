document.addEventListener("DOMContentLoaded", function() {
    // ★ 変更点 ★
    // GitHub Pages + 独自ドメインで、data/ や images/ がドメイン直下なら空文字にする
    const repositoryName = '';

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
    const questionNavContainer = document.getElementById("question-nav");

    let questions = [];              // 問題データ
    let currentQuestionIndex = 0;    // 今の問題番号(0-based)
    let userAnswers = [];            // ユーザーの解答を記録

    // localStorageキー (カテゴリー＆科目別に保持)
    const storageKey = `similarPracticeProgress-${category}-${subject}`;

    // ★ 追加: 10問ごとの部分スコア表示用モーダル
    const partialScoreModal = document.getElementById('partial-score-modal');
    const modalClose = document.getElementById('modal-close');
    const closeScoreBtn = document.getElementById('closeScoreBtn');
    const scoreDetails = document.getElementById('scoreDetails');
    let partialScoreChart = null; // Chart.jsインスタンス

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

            // ★ 追加: ナビゲーションを初期描画
            updateQuestionNav();

            displayQuestion();
        } catch (error) {
            console.error(error);
            alert(`問題データの読み込みに失敗しました: ${error.message}`);
        }
    }

    // ======== 問題番号ナビゲーションを作成/更新する関数 ========
    function updateQuestionNav() {
        if (!questionNavContainer) return;
        questionNavContainer.innerHTML = '';
        for (let i = 0; i < questions.length; i++) {
            const btn = document.createElement('button');
            btn.classList.add('question-btn');
            btn.textContent = i + 1;
            btn.dataset.index = i;

            // 解答済みならansweredを付与
            if (userAnswers[i]) {
                btn.classList.add('answered');
            }
            // 現在の問題にcurrentを付与
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

    // ======== 問題を表示する関数 ========
    function displayQuestion() {
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

        // 何問目か表示
        if (currentNumber) {
            currentNumber.textContent = (currentQuestionIndex + 1);
        }

        // 選択肢を描画
        if (choicesList) {
            choicesList.innerHTML = '';
            if (q.choices) {
                // choicesがオブジェクトの場合: Object.entries で取得
                Object.entries(q.choices).forEach(([key, value]) => {
                    const li = document.createElement('li');
                    li.classList.add('choice-item');  // --- カードデザイン用クラス

                    const label = document.createElement('label');
                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = 'choice';
                    input.value = key;

                    label.appendChild(input);
                    label.appendChild(document.createTextNode(`${key}: ${value}`));
                    li.appendChild(label);

                    // li全体をクリックでラジオチェック
                    li.addEventListener('click', () => {
                        input.checked = true;
                        // 他の選択肢から .selected を外す
                        const allLi = document.querySelectorAll('#choices-list li');
                        allLi.forEach(liEl => liEl.classList.remove('selected'));
                        // このliを選択状態に
                        li.classList.add('selected');
                    });

                    choicesList.appendChild(li);
                });
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

        // ボタンの状態
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

            // フィードバック (正誤)
            if (feedbackText) {
                const isCorrect = (userAnswer === correctAnswer);
                feedbackText.textContent = isCorrect
                    ? '正解です！'
                    : `不正解です。正解は ${correctAnswer} です。`;
                feedbackText.style.display = 'block';
                feedbackText.className = isCorrect ? 'correct' : 'incorrect';
            }

            // 解説
            if (explanationText) {
                explanationText.style.display = 'block';
                explanationText.innerHTML = q.explanation || '解説がありません。';
            }

            // 次の問題 or 結果表示
            if (answerBtn) answerBtn.disabled = true;
            if (nextBtn) {
                nextBtn.disabled = (currentQuestionIndex === questions.length - 1);
            }
            if (finishBtn && currentQuestionIndex === questions.length - 1) {
                finishBtn.style.display = 'inline-block';
            }

            // 進捗保存
            saveProgress();
            // ナビゲーション更新
            updateQuestionNav();
        });
    }

    // ======== 次の問題へ ========
    if (nextBtn) {
        nextBtn.addEventListener("click", function() {
            // ★ ここで doPartialScore() の代わりに、部分スコアモーダル表示
            // 10問ごと or 最終問題などのタイミングで表示
            if ((currentQuestionIndex + 1) % 10 === 0 && currentQuestionIndex < questions.length - 1) {
                showPartialScoreModal();
            }

            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                displayQuestion();
                updateQuestionNav();
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
                updateQuestionNav();
            }
            // 進捗保存
            saveProgress();
        });
    }

    // ======== 10問ごとに部分採点する (モーダル表示) ========
    function showPartialScoreModal() {
        // 直近10問の範囲計算
        const endIndex = currentQuestionIndex;
        const startIndex = Math.max(0, endIndex - 9);
        let answeredCountLocal = 0;
        let correctCountLocal = 0;
        for (let i = startIndex; i <= endIndex; i++) {
            if (!userAnswers[i]) continue;
            answeredCountLocal++;
            if (userAnswers[i].userAnswer === userAnswers[i].correctAnswer) {
                correctCountLocal++;
            }
        }
        const recentRate = (answeredCountLocal > 0)
            ? (correctCountLocal / answeredCountLocal * 100).toFixed(2)
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
            ? (totalCorrect / totalAnswered * 100).toFixed(2)
            : 0;

        // モーダル内テキスト更新
        if (scoreDetails) {
            scoreDetails.innerHTML = `
                <p>直近 (${startIndex+1}～${endIndex+1} 問目) 正解率: ${recentRate}%<br>
                累計正解率: ${totalRate}%</p>
            `;
        }

        // ★ Chart.js でグラフ描画
        const ctx = document.getElementById('scoreChart').getContext('2d');
        if (partialScoreChart) {
            partialScoreChart.destroy(); // 再生成のため破棄
        }
        partialScoreChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['直近10問', '累計'],
                datasets: [{
                    label: '正解率(%)',
                    data: [Number(recentRate), Number(totalRate)],
                    backgroundColor: ['#4caf50', '#2196f3']
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, max: 100 }
                },
            }
        });

        // モーダルを表示
        partialScoreModal.style.display = 'block';
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

        // 問題セクションを隠して結果セクションを表示
        document.getElementById('question-section').style.display = 'none';
        if (resultSection) {
            resultSection.style.display = 'block';
        }

        // 一旦終了扱いなのでlocalStorageを削除
        localStorage.removeItem(storageKey);
    }

    // ======== もう一度やり直す ========
    if (retryBtn) {
        retryBtn.addEventListener("click", function() {
            currentQuestionIndex = 0;
            userAnswers = [];
            localStorage.removeItem(storageKey);

            if (resultSection) resultSection.style.display = 'none';
            document.getElementById('question-section').style.display = 'block';
            displayQuestion();
            updateQuestionNav();
        });
    }

    // ======== 科目選択ページに戻る ========
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener("click", function() {
            window.location.href = `${repositoryName}/similar-practice.html`;
        });
    }
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

    // ======== モーダル閉じる処理 ========
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

    // ======== 実行 ========
    loadQuestions();
});
