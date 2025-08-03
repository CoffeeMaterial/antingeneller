import { useEffect, useState } from "react";
import { fetchGPTQuestion } from "./gpt";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState("🔴 Supabase disconnected");
  const [gptStatus, setGptStatus] = useState("🔴 GPT disconnected");

  useEffect(() => {
    checkSupabaseConnection();
    checkGPTConnection();
    loadExistingQuestions();
  }, []);

  async function checkSupabaseConnection() {
    try {
      const { error } = await supabase.from("questions").select("id").limit(1);
      if (!error) setSupabaseStatus("🟢 Supabase connected");
    } catch (err) {
      console.error("Supabase check error:", err);
    }
  }

  async function checkGPTConnection() {
    try {
      const result = await fetchGPTQuestion();
      if (result?.option1 && result?.option2) {
        setGptStatus("🟢 GPT connected");
      }
    } catch (err) {
      console.error("GPT check error:", err);
    }
  }

  async function loadExistingQuestions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const formatted = data.map((q) => ({
        ...q,
        votes: {
          option1: q.votes1 || 0,
          option2: q.votes2 || 0,
        },
      }));
      setQuestions(formatted);
      setCurrentQuestion(formatted[0]);
    } else {
      setCurrentQuestion(null);
    }

    setLoading(false);
  }

  async function loadNewQuestion() {
    setLoading(true);
    setShowStats(false);
    try {
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
        const saved = {
          ...data[0],
          votes: { option1: 0, option2: 0 },
        };
        setCurrentQuestion(saved);
        setQuestions((prev) => [saved, ...prev]);
      }
    } catch (err) {
      console.error("GPT fetch error:", err);
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
      prev.map((q) => (q.id === updated.id ? updated : q))
    );
    setShowStats(true);

    const { error } = await supabase
      .from("questions")
      .update({ votes1: updated.votes1, votes2: updated.votes2 })
      .eq("id", updated.id);

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
        <p>{supabaseStatus}</p>
        <p>{gptStatus}</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container">
        <h1>Antingen eller 18+</h1>
        <p>Inga frågor ännu.</p>
        <p>{supabaseStatus}</p>
        <p>{gptStatus}</p>
        <button onClick={loadNewQuestion}>Skapa första frågan</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Antingen eller 18+</h1>
      <p>{supabaseStatus}</p>
      <p>{gptStatus}</p>

      <div className="question">
        <p>{currentQuestion.option1}</p>
        <p>ELLER</p>
        <p>{currentQuestion.option2}</p>
      </div>

      {!showStats ? (
        <div className="buttons">
          <button onClick={() => vote("option1")}>Välj 1</button>
          <button onClick={() => vote("option2")}>Välj 2</button>
        </div>
      ) : (
        <div className="stats">
          <p>
            Alternativ 1:{" "}
            {getPercentage(
              currentQuestion.votes.option1,
              getTotalVotes(currentQuestion)
            )}
            %
          </p>
          <p>
            Alternativ 2:{" "}
            {getPercentage(
              currentQuestion.votes.option2,
              getTotalVotes(currentQuestion)
            )}
            %
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
                Resultat: {getPercentage(q.votes.option1, getTotalVotes(q))}% /{" "}
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