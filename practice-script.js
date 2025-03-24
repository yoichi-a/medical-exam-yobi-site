/* =============================
   メインスクリプト
   ============================= */
   document.addEventListener("DOMContentLoaded", function() {
    // GitHub Pages + 独自ドメイン用のパス指定 (空文字でもOK)
    const repositoryName = '';

    // URLパラメータ取得
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'basic';   // 例: basic
    const subject = urlParams.get('subject') || 'anatomy';   // 例: anatomy

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
            // 例: /data/similar/basic/anatomy.json
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

            // 前回の進捗があるか確認
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                // 前回の進捗データがある → モーダル表示
                resumeDialog.style.display = 'flex';
            } else {
                // なければ普通に開始
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
        resumeDialog.style.display = 'none';
        updateQuestionNav();
        displayQuestion();
    });

    // 新規スタート
    resumeNewstartBtn.addEventListener('click', () => {
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
            btn.textContent = i + 1; // 表示上は1始まり

            // 解答済みかどうか
            if (userAnswers[i]) {
                btn.classList.add('answered');
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

            // クリック時
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

        // 選択肢リスト再生成
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

                    // クリックで選択
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

        // フィードバック等リセット
        if (feedbackText) {
            feedbackText.style.display = 'none';
            feedbackText.textContent = '';
        }
        if (explanationText) {
            explanationText.style.display = 'none';
            explanationText.textContent = '';
        }

        // ボタン状態
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

            // 解説
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

    // ======= 次の問題へ =======
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            // 10問ごとにモーダル
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

    // ======= モーダルの閉じるボタン =======
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

    // ======= 実行 =======
    loadQuestions();
});

/* ============================
   評価＋コメント送信用スクリプト
   (Googleフォーム + ローカルストレージ)
============================= */

// GoogleフォームのベースURL
const formBaseUrl = "https://docs.google.com/forms/d/e/1FAIpQLSejXa2AzOHrOxzhKbCfNMwPQpELeanzo0-pw6AsG4AU4g5u-Q/viewform?usp=pp_url";

// entry.xxx のID（問題ID / 評価 / コメント）
const entryID_problem = "entry.2096008950"; // 問題ID
const entryID_rating  = "entry.449810669";  // 評価 (👍 or 👎)
const entryID_comment = "entry.1007552905"; // コメント

// 評価情報を保存するためのlocalStorageキー
const ratingStorageKey = "questionRatings";

// 全問題の評価情報をオブジェクトで管理
// { "anatomy-1": { rating: "👍", comment: "..." }, ... }
let ratingData = {};

// ページ読み込み時にストレージを読み込み、UIをセットアップ
window.addEventListener("DOMContentLoaded", () => {
  const savedRatings = localStorage.getItem(ratingStorageKey);
  if (savedRatings) {
    ratingData = JSON.parse(savedRatings);
  }
  setupRatingUI();
});

/**
 * 評価UIの初期化
 */
function setupRatingUI() {
  const thumbsUpBtn     = document.getElementById("thumbs-up-btn");
  const thumbsDownBtn   = document.getElementById("thumbs-down-btn");
  const ratingValueSpan = document.getElementById("rating-value");
  const ratingSubmitBtn = document.getElementById("rating-submit-btn");

  if (!thumbsUpBtn || !thumbsDownBtn || !ratingValueSpan || !ratingSubmitBtn) {
    return;
  }

  function selectRating(value) {
    ratingValueSpan.textContent = value; // 表示を更新
  }

  // クリックイベント
  thumbsUpBtn.addEventListener("click", () => {
    selectRating("👍");
  });
  thumbsDownBtn.addEventListener("click", () => {
    selectRating("👎");
  });

  // 「評価を送信」ボタンを押したら
  ratingSubmitBtn.addEventListener("click", () => {
    const currentRating = ratingValueSpan.textContent;
    const comment       = document.getElementById("rating-comment").value;
    const questionId    = makeQuestionId(); // 現在の問題ID取得

    // ローカルストレージに保存
    ratingData[questionId] = {
      rating: currentRating,
      comment: comment
    };
    localStorage.setItem(ratingStorageKey, JSON.stringify(ratingData));

    // GoogleフォームのURLを組み立て
    const formUrl = formBaseUrl
      + `&${entryID_problem}=` + encodeURIComponent(questionId)
      + `&${entryID_rating}=`  + encodeURIComponent(currentRating)
      + `&${entryID_comment}=` + encodeURIComponent(comment);

    // 別タブでフォームを開く
    window.open(formUrl, "_blank");

    // コメント欄をクリア
    document.getElementById("rating-comment").value = "";
  });
}

/**
 * 「教科 + 問題番号」の形式で問題IDを作る例
 * 例: subject=anatomy, currentQuestionIndex=4 → "anatomy-5"
 */
function makeQuestionId() {
  // URLクエリパラメータから教科を取得
  const urlParams = new URLSearchParams(window.location.search);
  const subject = urlParams.get('subject') || 'unknownSubject';

  // もし「現在の問題番号(currentQuestionIndex)」をグローバルには参照しづらい場合は
  //  localStorage などで管理している値を取得してもOKですが、
  // ここでは簡易的に `localStorage["similarPracticeProgress-category-subject"]` を
  //  解析して取得するやり方もあります。

  // 例: localStorage から取り出し
  const category = urlParams.get('category') || 'basic';
  const storageKey = `similarPracticeProgress-${category}-${subject}`;
  const saved = localStorage.getItem(storageKey);
  let indexNow = 0; // デフォルト

  if (saved) {
    const parsed = JSON.parse(saved);
    if (typeof parsed.currentQuestionIndex === 'number') {
      indexNow = parsed.currentQuestionIndex;
    }
  }

  // IDは: subject + "-" + (indexNow+1)
  return subject + "-" + (indexNow + 1);
}
