import { useEffect, useState } from "react";
import { fetchGPTQuestion } from "./gpt";
import "./App.css";

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewQuestion();
  }, []);

  async function loadNewQuestion() {
    setLoading(true);
    setShowStats(false);
    try {
      const gptQuestion = await fetchGPTQuestion();
      setCurrentQuestion(gptQuestion);
      setQuestions((prev) => [...prev, gptQuestion]);
    } catch (err) {
      console.error("Failed to fetch GPT question:", err);
    } finally {
      setLoading(false);
    }
  }

  function vote(optionKey) {
    if (!currentQuestion) return;
    const updatedVotes = { ...currentQuestion.votes };
    updatedVotes[optionKey] += 1;
    const updated = { ...currentQuestion, votes: updatedVotes };
    setCurrentQuestion(updated);
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === prev.length - 1 ? updated : q))
    );
    setShowStats(true);
  }

  function getTotalVotes(q) {
    return q.votes.option1 + q.votes.option2;
  }

  function getPercentage(count, total) {
    return total === 0 ? 0 : Math.round((count / total) * 100);
  }

  if (loading && !currentQuestion) {
    return (
      <div className="container">
        <h1>Antingen eller 18+</h1>
        <p>Laddar ny fråga från AI...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Antingen eller 18+</h1>

      {currentQuestion && (
        <div className="question">
          <p>{currentQuestion.option1}</p>
          <p>ELLER</p>
          <p>{currentQuestion.option2}</p>
        </div>
      )}

      {!showStats ? (
        <div className="buttons">
          <button onClick={() => vote("option1")}>Välj 1</button>
          <button onClick={() => vote("option2")}>Välj 2</button>
        </div>
      ) : (
        <div className="stats">
          <p>
            Alternativ 1: {getPercentage(currentQuestion.votes.option1, getTotalVotes(currentQuestion))}%
          </p>
          <p>
            Alternativ 2: {getPercentage(currentQuestion.votes.option2, getTotalVotes(currentQuestion))}%
          </p>
          <button onClick={loadNewQuestion}>Nästa fråga</button>
        </div>
      )}

      {questions.length > 1 && (
        <div className="history">
          <h2>Tidigare frågor</h2>
          {questions.slice(0, -1).map((q, i) => (
            <div key={i} className="previous">
              <p><strong>1:</strong> {q.option1}</p>
              <p><strong>2:</strong> {q.option2}</p>
              <p>
                Resultat: {getPercentage(q.votes.option1, getTotalVotes(q))}% /
                {getPercentage(q.votes.option2, getTotalVotes(q))}%
              </p>
              <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;