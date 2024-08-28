document.addEventListener("DOMContentLoaded", function() {
    // 仮の問題データ
    const questions = [
        "内科学の問題1", 
        "内科学の問題2", 
        "内科学の問題3", 
        "内科学の問題4", 
        "内科学の問題5"
        // ... 他の問題を追加
    ];
    
    let currentQuestionIndex = 0; // 現在の問題番号を追跡

    // HTML要素の参照
    const questionText = document.getElementById("question-text");
    const answerText = document.getElementById("answer-text");
    const answerBtn = document.getElementById("answer-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    // 初期の問題を表示
    function displayQuestion() {
        questionText.textContent = questions[currentQuestionIndex]; // 現在の問題を表示
        answerText.style.display = "none";  // 解答は非表示にする
    }

    // 解答を表示する
    answerBtn.addEventListener("click", function() {
        answerText.style.display = "block";  // 解答を表示する（ここでは仮のテキスト）
        answerText.textContent = "解答: これは仮の解答です。";  // 仮の解答
    });

    // 次の問題に移動
    nextBtn.addEventListener("click", function() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;  // 問題番号を1つ進める
            displayQuestion();  // 新しい問題を表示
        }
    });

    // 前の問題に移動
    prevBtn.addEventListener("click", function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;  // 問題番号を1つ戻す
            displayQuestion();  // 新しい問題を表示
        }
    });

    // 初期の問題を表示
    displayQuestion();
});
