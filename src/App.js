import React, { useState, useEffect } from 'react';
import './App.css';
import { requestToken, getQuizData } from './api';

function Quiz() {
  // Declaration for states
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isQuizStarted, setIsQuizStarted] = useState(false);

  

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

  const goToNextQuestion = () => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
    } else {
      setShowResults(true);
    }
  };



  const handleAnswerClick = (answer) => {
    const newUserAnswers = [...userAnswers];
    const correctAnswer = questions[currentQuestionIndex].correct_answer;
    const isCorrect = answer === correctAnswer;

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



  // Reset timer when index is changed
  useEffect(() => {
    setTimeLeft(30); // set timer for 30s
  }, [currentQuestionIndex]);

  // useEffect for handling timer
  useEffect(() => {
    let timerId;

    if (isQuizStarted && timeLeft > 0) {      
      timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    }

    // Move to next question if timeout
    if (isQuizStarted && timeLeft === 0) {
      goToNextQuestion();
    }

    // Clear timer
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timeLeft, isQuizStarted]);




  if (isLoading) {
    // Show loader when page is loaded
    return <div className='loader-container'>
      <div className="loader"></div>
    </div>
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isQuizStarted) {
    // Rendering Start page (Welcome page)
    return (
      <div className="Quiz-start-page">
        <h1>Test Your Knowledge!</h1>
        <button onClick={startQuiz}>Start Quiz</button>
      </div>
    );
  }

  // Components implementation section

  function QuizOptions({ answers, userAnswer, onAnswerClick, correctAnswer }) {
    return (
      <div className="Quiz-options">
        {answers.map((answer, index) => {
          const isSelected = userAnswer?.answer === answer;
          let buttonClass = 'answer-button'; // default class for answer buttons

          if (isSelected) {
            if (userAnswer.isCorrect) {
              buttonClass += ' correct'; // Highlight selected correct answer
            } else {
              buttonClass += ' incorrect'; // Highlight selected incorrect answer
            }
          } else if (answer === correctAnswer && userAnswer && !userAnswer.isCorrect) {
            buttonClass += ' correct'; // Highlight correct answer if a wrong answer is selected
          }

          return (
            <button
              key={index}
              className={buttonClass}
              onClick={() => onAnswerClick(answer)}
              disabled={!!userAnswer}
            >
              {answer}
            </button>
          );
        })}
      </div>
    );
  }

  function QuizNavigation() {
    return (
      <div className="Quiz-navigation">
        {currentQuestionIndex > 0 && (
          <button onClick={goToPreviousQuestion}>Previous</button>
        )}
        {currentQuestionIndex < questions.length - 1 ? (
          <button onClick={goToNextQuestion}>Next</button>
        ) : (
          <button onClick={() => setShowResults(true)}>Show Results</button>
        )}
      </div>

    );
  }


  return (
    <div className="Quiz">
      {showResults ? (
        // Results Screen: Displays the user's score and provides a button to restart the quiz
        <div className="Quiz-results">
          <div>Your score is {score} out of {questions.length}.</div>
          <button onClick={restartQuiz}>Restart Quiz</button>
        </div>
      ) : (
        // Quiz Question Screen: Includes the timer, current question, answer options, and navigation buttons
        <>
          <div className="Quiz-timer">Time left: {timeLeft} seconds</div>
          <div className="Quiz-question">
            {questions.length > 0 && (
              <>
                <div>
                  <div>Question {currentQuestionIndex + 1}/{questions.length}</div>
                  <div className="Quiz-question-text">{questions[currentQuestionIndex].question}</div>
                </div>

                <QuizOptions
                  answers={questions[currentQuestionIndex].answers}
                  userAnswer={userAnswers[currentQuestionIndex]}
                  onAnswerClick={handleAnswerClick}
                  correctAnswer={questions[currentQuestionIndex].correct_answer}
                />

                <QuizNavigation />

              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}


export default Quiz;