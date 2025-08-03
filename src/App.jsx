import { useEffect, useState } from "react";
import { fetchGPTQuestion } from "./gpt";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExistingQuestions();
  }, []);

  async function loadExistingQuestions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const formatted = data.map(q => ({
        ...q,
        votes: {
          option1: q.votes1 || 0,
          option2: q.votes2 || 0
        }
      }));
      setQuestions(formatted);
      setCurrentQuestion(formatted[0]);
    } else {
      console.error("Failed to load questions:", error);
      setCurrentQuestion(null);
    }
    setLoading(false);
  }

  async function loadNewQuestion() {
    setLoading(true);
    setShowStats(false);

    const reuseProbability = 0.3;
    const shouldReuse = Math.random() < reuseProbability;

    try {
      if (shouldReuse) {
        const usedIds = questions.map((q) => q.id);

        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase
            .from("questions")
            .select("*")
            .order("random()")
            .limit(1);

          if (!error && data && data.length > 0) {
            const reused = data[0];
            if (!usedIds.includes(reused.id)) {
              const formatted = {
                ...reused,
                votes: {
                  option1: reused.votes1 || 0,
                  option2: reused.votes2 || 0,
                },
              };
              setCurrentQuestion(formatted);
              setQuestions((prev) => [formatted, ...prev]);
              return;
            }
          }
        }

        console.log("No new reusable questions found, falling back to GPT");
      }

      const gptQuestion = await fetchGPTQuestion();
      const { data, error } = await supabase
        .from("questions")
        .insert([
          {
            option1: gptQuestion.option1,
            option2: gptQuestion.option2,
            votes1: 0,
            votes2: 0,
          },
        ])
        .select();

      if (!error && data && data.length > 0) {
        const savedQuestion = {
          ...data[0],
          votes: { option1: 0, option2: 0 },
        };
        setCurrentQuestion(savedQuestion);
        setQuestions((prev) => [savedQuestion, ...prev]);
      } else {
        console.error("Failed to save GPT question:", error);
      }
    } catch (err) {
      console.error("Failed to load question:", err);
    } finally {
      setLoading(false);
    }
  }

  async function vote(optionKey) {
    if (!currentQuestion) return;
    const updatedVotes = { ...currentQuestion.votes };
    updatedVotes[optionKey] += 1;

    const updated = {
      ...currentQuestion,
      votes: updatedVotes,
      votes1: updatedVotes.option1,
      votes2: updatedVotes.option2,
    };

    setCurrentQuestion(updated);
    setQuestions((prev) =>
      prev.map((q) => (q.id === currentQuestion.id ? updated : q))
    );
    setShowStats(true);

    const { error } = await supabase
      .from("questions")
      .update({ votes1: updated.votes1, votes2: updated.votes2 })
      .eq("id", currentQuestion.id);

    if (error) console.error("Failed to save vote:", error);
  }

  function getTotalVotes(q) {
    return (q.votes?.option1 || 0) + (q.votes?.option2 || 0);
  }

  function getPercentage(count, total) {
    return total === 0 ? 0 : Math.round((count / total) * 100);
  }

  if (loading) {
    return (
      <div className="container">
        <h1>Antingen eller 18+</h1>
        <p>Hämtar frågor...</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container">
        <h1>Antingen eller 18+</h1>
        <p>Inga frågor tillgängliga just nu.</p>
        <button onClick={loadNewQuestion}>Skapa första frågan</button>
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
          {questions.slice(1).map((q) => (
            <div key={q.id} className="previous">
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