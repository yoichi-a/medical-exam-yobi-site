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

    // 各種要素
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

    // 部分スコアモーダル
    const partialScoreModal = document.getElementById('partial-score-modal');
    const modalClose = document.getElementById('modal-close');
    const closeScoreBtn = document.getElementById('closeScoreBtn');
    const scoreDetails = document.getElementById('scoreDetails');
    let partialScoreChart = null;

    // 前回進捗モーダル
    const resumeDialog = document.getElementById('resume-dialog');
    const resumeContinueBtn = document.getElementById('resume-continue-btn');
    const resumeNewstartBtn = document.getElementById('resume-newstart-btn');
    const resumeGobackBtn = document.getElementById('resume-goback-btn');

    // 問題データ
    let questions = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];

    // localStorageキー
    const storageKey = `similarPracticeProgress-${category}-${subject}`;

    // タイトルをセット
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

            if (totalNumber) {
                totalNumber.textContent = questions.length;
            }

            // 前回の進捗があるか？
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                resumeDialog.style.display = 'flex';
            } else {
                updateQuestionNav();
                displayQuestion();
            }

        } catch (err) {
            console.error(err);
            alert(`問題データの読み込みに失敗しました: ${err.message}`);
        }
    }

    // ===== 前回の続き / 新規スタート / 戻る =====
    resumeContinueBtn.addEventListener('click', () => {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            currentQuestionIndex = parsedData.currentQuestionIndex || 0;
            userAnswers = parsedData.userAnswers || [];
        }
        resumeDialog.style.display = 'none';
        updateQuestionNav();
        displayQuestion();
    });

    resumeNewstartBtn.addEventListener('click', () => {
        localStorage.removeItem(storageKey);
        currentQuestionIndex = 0;
        userAnswers = [];
        resumeDialog.style.display = 'none';
        updateQuestionNav();
        displayQuestion();
    });

    resumeGobackBtn.addEventListener('click', () => {
        window.location.href = `${repositoryName}/similar-practice.html`;
    });

    // ===== 問題番号ナビゲーションを更新 =====
    function updateQuestionNav() {
        if (!questionNavContainer) return;
        questionNavContainer.innerHTML = '';

        for (let i = 0; i < questions.length; i++) {
            const btn = document.createElement('button');
            btn.classList.add('question-btn');
            btn.textContent = i + 1;

            if (userAnswers[i]) {
                btn.classList.add('answered');
                const { userAnswer, correctAnswer } = userAnswers[i];
                if (userAnswer === correctAnswer) {
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('incorrect');
                }
            }

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

    // ===== 問題を表示 =====
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

        if (feedbackText) {
            feedbackText.style.display = 'none';
            feedbackText.textContent = '';
        }
        if (explanationText) {
            explanationText.style.display = 'none';
            explanationText.textContent = '';
        }

        if (prevBtn) {
            prevBtn.disabled = (currentQuestionIndex === 0);
        }
        if (nextBtn) {
            nextBtn.disabled = true;
        }
        if (answerBtn) {
            answerBtn.disabled = false;
        }
        if (finishBtn) {
            finishBtn.style.display = 'none';
        }
    }

    // ===== 解答送信 =====
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

            userAnswers[currentQuestionIndex] = {
                userAnswer,
                correctAnswer,
                isCorrect
            };

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
            if (explanationText) {
                explanationText.style.display = 'block';
                explanationText.innerHTML = q.explanation || '解説がありません。';
            }

            if (nextBtn) {
                nextBtn.disabled = (currentQuestionIndex === questions.length - 1);
            }
            if (finishBtn && currentQuestionIndex === questions.length - 1) {
                finishBtn.style.display = 'inline-block';
            }

            answerBtn.disabled = true;
            saveProgress();
            updateQuestionNav();
        });
    }

    // ===== 次の問題へ =====
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if ((currentQuestionIndex + 1) % 10 === 0 && currentQuestionIndex < questions.length - 1) {
                showPartialScoreModal();
            }
            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                displayQuestion();
                updateQuestionNav();
            }
            saveProgress();
        });
    }

    // ===== 前の問題へ =====
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

    // ===== 10問ごとの部分スコア =====
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

        if (scoreDetails) {
            scoreDetails.innerHTML = `
              <p>直近 (${startIndex+1}～${endIndex+1} 問目) 正答率: ${recentRate}%<br>
              累計正答率: ${totalRate}%</p>
            `;
        }

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
                    data: [Number(recentRate), Number(totalRate)]
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

        partialScoreModal.style.display = 'flex';
        partialScoreModal.classList.remove('modal-hide');
        partialScoreModal.classList.add('modal-show');
    }

    // ===== 結果を表示 =====
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

            // confetti() など演出したい場合はここで

            localStorage.removeItem(storageKey);
        });
    }

    // ===== やり直す =====
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

    // ===== 戻る =====
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

    // ===== 進捗保存 =====
    function saveProgress() {
        const dataToSave = {
            currentQuestionIndex,
            userAnswers
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }

    // ===== モーダル閉じる =====
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
    function closeModalWithFadeOut() {
        partialScoreModal.classList.remove('modal-show');
        partialScoreModal.classList.add('modal-hide');
        setTimeout(() => {
            partialScoreModal.style.display = 'none';
            partialScoreModal.classList.remove('modal-hide');
        }, 300);
    }

    // 実行
    loadQuestions();
});

/* ============================
   ページ遷移なしでGoogleフォーム送信
   ============================ */
window.addEventListener("DOMContentLoaded", () => {
  const thumbsUpBtn       = document.getElementById("thumbs-up-btn");
  const thumbsDownBtn     = document.getElementById("thumbs-down-btn");
  const ratingValueSpan   = document.getElementById("rating-value");
  const ratingCommentArea = document.getElementById("rating-comment");
  const ratingSubmitBtn   = document.getElementById("rating-submit-btn");
  const resultMessage     = document.getElementById("rating-result-message");

  if (!thumbsUpBtn || !thumbsDownBtn || !ratingValueSpan ||
      !ratingCommentArea || !ratingSubmitBtn || !resultMessage) {
    return;
  }

  // 評価ボタン
  thumbsUpBtn.addEventListener("click", () => {
    ratingValueSpan.textContent = "👍";
  });
  thumbsDownBtn.addEventListener("click", () => {
    ratingValueSpan.textContent = "👎";
  });

  // 「評価を送信」ボタン → 隠しフォームに値をセットしsubmit
  ratingSubmitBtn.addEventListener("click", () => {
    const qidField     = document.getElementById("google-qid");
    const ratingField  = document.getElementById("google-rating");
    const commentField = document.getElementById("google-comment");

    const questionId = getCurrentQuestionId(); 
    qidField.value     = questionId;
    ratingField.value  = ratingValueSpan.textContent;
    commentField.value = ratingCommentArea.value.trim();

    // フォーム送信
    const formEl = document.getElementById("google-form");
    formEl.submit();

    // 送信完了メッセージをとりあえず表示
    resultMessage.style.display = "block";
    resultMessage.textContent = "送信しました。ご協力ありがとうございます！";

    // コメント欄をクリア
    ratingCommentArea.value = "";
  });
});

/**
 * 現在の問題IDを "科目-問題番号" の形式で返す例
 */
function getCurrentQuestionId() {
  const urlParams = new URLSearchParams(window.location.search);
  const subject = urlParams.get('subject') || 'unknown';

  // localStorageから現在の問題インデックスを取得
  const category = urlParams.get('category') || 'basic';
  const storageKey = `similarPracticeProgress-${category}-${subject}`;
  let currentIdx = 0;
  const savedData = localStorage.getItem(storageKey);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (typeof parsed.currentQuestionIndex === 'number') {
        currentIdx = parsed.currentQuestionIndex;
      }
    } catch(e) {/* nop */}
  }
  return `${subject}-${currentIdx + 1}`;
}

/**
 * フォーム送信時のイベントハンドラ
 * 実際は特に何もしませんが、onGoogleFormSubmit() でtrueを返すと送信継続
 */
function onGoogleFormSubmit() {
  // ここで false を返すと送信中断になるので注意
  return true;
}
