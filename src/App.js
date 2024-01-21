import React, { useState, useEffect } from 'react';
import './App.css';
import { requestToken, getQuizData } from './api';

function Quiz() {
  const [questions, setQuestions] = useState([]); // Set state for storing questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading
  const [error, setError] = useState(null); // Error
  const [timeLeft, setTimeLeft] = useState(30); // 타이머 상태를 추가합니다.
  const [isQuizStarted, setIsQuizStarted] = useState(false);


  const goToNextQuestion = () => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
    } else {
      setShowResults(true); // 마지막 질문에 답변 후 결과를 표시
    }
  };


  // 현재 질문 인덱스가 변경될 때마다 타이머를 재설정합니다.
  useEffect(() => {
    setTimeLeft(30); // 각 질문마다 타이머를 30초로 재설정합니다.
  }, [currentQuestionIndex]);

  // 타이머를 처리하는 useEffect
  useEffect(() => {
    let timerId;
  
    if (isQuizStarted && timeLeft > 0) {
      // 타이머가 실행중일 때만 인터벌을 설정합니다.
      timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    }
  
    // 타이머가 0이 되면 자동으로 다음 질문으로 이동합니다.
    if (isQuizStarted && timeLeft === 0) {
      goToNextQuestion();
    }
  
    // 컴포넌트 언마운트 시 또는 타이머가 0에 도달했을 때 인터벌을 클리어합니다.
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timeLeft, isQuizStarted, goToNextQuestion]);

  useEffect(() => {
    const setupQuiz = async () => {
      try {
        setIsLoading(true); // Start loading
        setError(null); // Initialise the error
        const token = await requestToken();
        if (token) {
          const newQuestions = await getQuizData(10, token);
          setQuestions(newQuestions);
          setUserAnswers(new Array(newQuestions.length).fill(null));
        }
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    setupQuiz();
  }, []);

  const startQuiz = async () => {
    setIsLoading(true);
    setError(null);
    const token = await requestToken();
    if (token) {
      const newQuestions = await getQuizData(10, token);
      setQuestions(newQuestions);
      setUserAnswers(new Array(newQuestions.length).fill(null));
      setIsQuizStarted(true); 
    } else {
      setError('Failed to get the quiz data. Please try again.');
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="loader"></div>
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isQuizStarted) {
    // 퀴즈가 아직 시작되지 않았을 때 렌더링 될 스타트 페이지
    return (
      <div className="Quiz-start-page">
        <h1>Welcome</h1>
        <button onClick={startQuiz}>Start Quiz</button>
      </div>
    );
  }



  const handleAnswerClick = (answer) => {
    const newUserAnswers = [...userAnswers];
    const isCorrect = answer === questions[currentQuestionIndex].correct_answer;

    // Save answers
    newUserAnswers[currentQuestionIndex] = { answer, isCorrect };
    setUserAnswers(newUserAnswers);

    // Update score
    if (isCorrect) {
      setScore(score + 1);
    }

    // Go to next question or exit if it is the last question
    setTimeout(() => {
      const nextQuestionIndex = currentQuestionIndex + 1;
      if (nextQuestionIndex < questions.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
      } else {
        setShowResults(true);
      }
    }, 1000); // delay for 1000 ms
  };

  const goToPreviousQuestion = () => {
    const prevQuestionIndex = currentQuestionIndex - 1;
    if (prevQuestionIndex >= 0) {
      setCurrentQuestionIndex(prevQuestionIndex);
    }
  };



  const restartQuiz = () => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setUserAnswers(new Array(questions.length).fill(null));
    setScore(0);
  };

  return (
    <div className="Quiz">
      {showResults ? (
        <div className="Quiz-results">
          <div>Your score is {score} out of {questions.length}.</div>
          <button onClick={restartQuiz}>Restart Quiz</button>
        </div>
      ) : (
        <>
          <div className="Quiz-timer">Time left: {timeLeft} seconds</div>
          <div className="Quiz-question">
            {questions.length > 0 && (
              <>
                <div>
                  <div>Question {currentQuestionIndex + 1}/{questions.length}</div>
                  <div className="Quiz-question-text">{questions[currentQuestionIndex].question}</div>
                </div>
                <div className="Quiz-options">
                  {questions[currentQuestionIndex].incorrect_answers.concat(questions[currentQuestionIndex].correct_answer).map((answer, index) => {
                    const isSelected = userAnswers[currentQuestionIndex] === answer;
                    const buttonClass = isSelected
                      ? (answer === questions[currentQuestionIndex].correct_answer ? 'correct' : 'incorrect')
                      : '';
                    return (
                      <button
                        key={index}
                        className={buttonClass}
                        onClick={() => handleAnswerClick(answer)}
                        disabled={userAnswers[currentQuestionIndex] !== null}
                      >
                        {answer}
                      </button>
                    );
                  })}
                </div>
                <div className="Quiz-navigation">
                  {currentQuestionIndex > 0 && (
                    <button onClick={goToPreviousQuestion}>Previous</button>
                  )}
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button onClick={goToNextQuestion}>Next</button>
                  ) : (
                    <button onClick={() => setShowResults(true)}>
                      Show Results
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Quiz;
