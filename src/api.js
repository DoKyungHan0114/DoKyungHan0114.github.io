// src/api.js

// HTML Decode Function
export const htmlDecode = (input) => {
  const doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
};

// Shuffle Algorithm
function shuffleAnswers(correctAnswer, incorrectAnswers) {
  const answers = [correctAnswer, ...incorrectAnswers];

  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }

  return answers;
}

// Request session token
export const requestToken = async () => {
  try {
    const response = await fetch("https://opentdb.com/api_token.php?command=request");
    if (!response.ok) {
      throw new Error('Token request failed');
    }
    const data = await response.json();

    // Check status for response from API
    if (data.response_code === 2) {
      console.error('Invalid Parameter!')
    }
    if (data.response_code === 3) {
      console.error('Token not found: Need to request a new token.');
    } else if (data.response_code === 4) {
      console.error('Token is empty: Need to reset.');
    } else if (data.response_code === 5) {
      console.error('Rate limit: Too many requests.');
    }
    return data.token;

  } catch (error) {
    console.error('Error fetching token: ', error);
    return null;
  }
};

// Get data from database with added delay
export const getQuizData = async (amount = 10, token) => {
  try {
    const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple&token=${token}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Questions request failed');
    }
    const data = await response.json();
    
    // Delay using setTimeout
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(data.results.map((question) => ({
          ...question,
          question: htmlDecode(question.question),
          correct_answer: htmlDecode(question.correct_answer),
          incorrect_answers: question.incorrect_answers.map(htmlDecode),
          answers: shuffleAnswers(htmlDecode(question.correct_answer), question.incorrect_answers.map(htmlDecode)), // Store answer with using shuffle function above
        })));
      }, 4000); // 4000ms delay
    });
    
  } catch (error) {
    console.error('Error fetching questions: ', error);
    return [];
  }
};
