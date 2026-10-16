import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, FileCheck2, FileText, Layers3, ListChecks, Menu, Route, ShieldCheck, Target, Users, Volume2, VolumeX, Workflow, X } from "lucide-react";
import { useLessonAudio } from "./useLessonAudio";

function DetailTable({ table }) {
  if (!table) return null;
  return (
    <div className="detail-table-wrap">
      <table className="detail-table">
        <thead><tr>{table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{table.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function FocusModal({ content, imageFor, onClose, onRead, action = "Mark as read" }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="focus-modal" role="dialog" aria-modal="true" aria-labelledby="focus-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        {content.image && <img src={imageFor(content.image)} alt="" />}
        {content.subtitle && <p className="detail-subtitle">{content.subtitle}</p>}
        <h3 id="focus-title">{content.title}</h3>
        {content.text && <p className="detail-text">{content.text}</p>}
        {content.bullets && <ul>{content.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
        <DetailTable table={content.table} />
        {content.note && <div className="detail-note">{content.note.split("\n").map((line, index) => <p key={index}>{line || " "}</p>)}</div>}
        <button className="modal-action" type="button" onClick={() => { onRead(); onClose(); }}>{action} <Check /></button>
      </section>
    </div>,
    document.body,
  );
}

function ScreenHeader({ screen, imageFor }) {
  return (
    <div className="pmp-section-head">
      <div>
        <h2>{screen.headline}</h2>
        {screen.intro && <p className="lead">{screen.intro}</p>}
      </div>
      <img className="section-illustration" src={imageFor(screen.image)} alt="" />
    </div>
  );
}

function RevealScreen({ screen, imageFor, complete, onComplete }) {
  const [focus, setFocus] = useState(null);
  return (
    <div className="content-grid">
      <div className="content-copy">
        <p className="screen-kicker">Lesson {screen.lessonNumber}</p>
        <h1>{screen.headline}</h1>
        {screen.lead && <p className="lead">{screen.lead}</p>}
        <button className="primary-cta" type="button" disabled={complete} onClick={() => setFocus(screen.reveal)}>
          {complete ? "Explored" : screen.cta} <ArrowRight />
        </button>
      </div>
      <img className="lesson-art" src={imageFor(screen.image)} alt="" />
      {focus && <FocusModal content={{ ...focus, image: focus.image || screen.image }} imageFor={imageFor} onClose={() => setFocus(null)} onRead={onComplete} />}
    </div>
  );
}

function CardGrid({ items, visited, onOpen }) {
  const iconSet = [Compass, Layers3, Workflow, Users, FileText, ListChecks, ShieldCheck, Route, FileCheck2];
  const countClass = items.length === 4 ? "two-by-two" : items.length >= 5 ? "three" : items.length === 3 ? "three" : "two";
  return (
    <div className={`card-grid ${countClass}`}>
      {items.map((item) => {
        const CardIcon = iconSet[item.index % iconSet.length];
        return <button className={`click-card ${visited.has(item.index) ? "read" : ""}`} type="button" key={item.index} onClick={() => onOpen(item.index)}>
          <span className="card-icon"><CardIcon /></span>
          <span className="card-copy"><strong>{item.title}</strong>{item.subtitle && <small>{item.subtitle}</small>}</span>
          {visited.has(item.index) ? <Check className="card-arrow check" /> : <ArrowRight className="card-arrow" />}
        </button>;
      })}
    </div>
  );
}

function ExploreScreen({ screen, imageFor, visited, onVisit, onComplete }) {
  const [active, setActive] = useState(null);
  const visible = screen.items.map((item, index) => ({ ...item, index }));
  const allRead = visited.size === screen.items.length;

  useEffect(() => { if (allRead) onComplete(); }, [allRead, onComplete]);

  return (
    <div className="grid-page">
      <ScreenHeader screen={screen} imageFor={imageFor} />
      <CardGrid items={visible} visited={visited} onOpen={setActive} />
      {allRead && screen.after && <div className="revealed-note"><strong>{screen.after.title}</strong><p>{screen.after.text}</p>{screen.after.note && <small>{screen.after.note}</small>}</div>}
      {allRead && screen.anchor && <div className="knowledge-anchor"><Target /><div><strong>Knowledge anchor</strong><p>{screen.anchor}</p></div></div>}
      {active !== null && <FocusModal content={screen.items[active]} imageFor={imageFor} onClose={() => setActive(null)} onRead={() => onVisit(active)} />}
    </div>
  );
}

function SelfCheck({ rows, scale, onDone }) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const row = rows[index];
  const finished = scores.length === rows.length;
  const choose = (score) => {
    const next = [...scores, score];
    setScores(next);
    if (next.length === rows.length) onDone();
    else setIndex((value) => value + 1);
  };
  if (finished) {
    const total = scores.reduce((sum, score) => sum + score, 0);
    return <div className="score-summary"><span><Check /></span><div><strong>Self-check complete</strong><p>{total} of {rows.length * 4}. Revisit any area you scored below 3.</p></div></div>;
  }
  return (
    <div className="self-check-card">
      <div className="self-check-progress"><span>Area {index + 1} of {rows.length}</span><i><b style={{ width: `${(index / rows.length) * 100}%` }} /></i></div>
      <p className="self-check-area">{row.area}</p>
      <h2>{row.ready}</h2>
      <p className="revisit">{row.revisit}</p>
      <div className="score-buttons">{scale.map((label, scoreIndex) => <button type="button" key={label} onClick={() => choose(scoreIndex + 1)}><span>{scoreIndex + 1}</span>{label}</button>)}</div>
    </div>
  );
}

function SelfCheckScreen({ screen, imageFor, onComplete }) {
  const [focus, setFocus] = useState(null);
  const [done, setDone] = useState(false);
  return (
    <div className="grid-page">
      <ScreenHeader screen={screen} imageFor={imageFor} />
      <SelfCheck rows={screen.rows} scale={screen.scale} onDone={() => { setDone(true); onComplete(); }} />
      {done && <button className="knowledge-cta" type="button" onClick={() => setFocus({ title: "Course map and exam lens", table: screen.crosswalk, text: screen.examLens, note: screen.summary, image: screen.lensImage })}><Target /> Open exam lens</button>}
      {focus && <FocusModal content={focus} imageFor={imageFor} onClose={() => setFocus(null)} onRead={() => {}} action="Done" />}
    </div>
  );
}

function QuizScreen({ screen, imageFor, onComplete }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [checksDone, setChecksDone] = useState(false);
  const [selfDone, setSelfDone] = useState(false);
  const [lens, setLens] = useState(false);
  const question = screen.quiz[questionIndex];
  const correct = picked === question.correct;
  const next = () => {
    if (questionIndex === screen.quiz.length - 1) setChecksDone(true);
    else { setQuestionIndex((value) => value + 1); setPicked(null); }
  };
  useEffect(() => { if (checksDone && selfDone) onComplete(); }, [checksDone, selfDone, onComplete]);
  return (
    <div className="grid-page">
      <ScreenHeader screen={screen} imageFor={imageFor} />
      {!checksDone ? (
        <div className="quiz-card">
          <div className="quiz-step"><Target /> Check {questionIndex + 1} of {screen.quiz.length}</div>
          <h2>{question.question}</h2>
          <div className="answers">{question.answers.map((answer, index) => <button type="button" key={answer} className={picked === index ? (correct ? "correct" : "wrong") : ""} onClick={() => setPicked(index)}><span>{String.fromCharCode(65 + index)}</span>{answer}</button>)}</div>
          {picked !== null && <div className={`feedback ${correct ? "good" : "bad"}`}><p>{correct ? question.feedback : "Not quite. Compare the defining test in the lesson, then choose again."}</p>{!correct && <small>Try another answer.</small>}</div>}
          {correct && <button className="modal-action quiz-next" type="button" onClick={next}>{questionIndex === screen.quiz.length - 1 ? "Continue to self-check" : "Next check"} <ArrowRight /></button>}
        </div>
      ) : !selfDone ? (
        <SelfCheck rows={screen.rows} scale={screen.scale} onDone={() => setSelfDone(true)} />
      ) : (
        <div className="score-summary"><span><Check /></span><div><strong>Knowledge check completed</strong><p>You completed all three checks and the self-score.</p><button className="knowledge-cta" type="button" onClick={() => setLens(true)}><Target /> Open exam lens</button></div></div>
      )}
      {lens && <FocusModal content={{ title: "Exam lens", text: screen.examLens, image: screen.lensImage }} imageFor={imageFor} onClose={() => setLens(false)} onRead={() => {}} action="Done" />}
    </div>
  );
}

function CompletionModal({ lesson, onClose }) {
  return createPortal(<div className="modal-backdrop"><section className="completion-modal" role="dialog" aria-modal="true" aria-labelledby="complete-title"><div className="completion-icon"><Check /></div><p>LESSON COMPLETE</p><h3 id="complete-title">Lesson {lesson.number}</h3><span>{lesson.title}</span><button className="modal-action" type="button" onClick={onClose}>Done <Check /></button></section></div>, document.body);
}

export function LessonApp({ lesson, imageFor }) {
  const [screenIndex, setScreenIndex] = useState(0);
  const [completed, setCompleted] = useState(() => lesson.screens.map(() => false));
  const [visited, setVisited] = useState({});
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [lessonComplete, setLessonComplete] = useState(false);
  const footerRef = useRef(null);
  const screen = lesson.screens[screenIndex];
  const currentVisited = useMemo(() => new Set(visited[screen.id] || []), [visited, screen.id]);
  useLessonAudio(soundOn);
  const markComplete = useCallback(() => setCompleted((state) => state.map((value, index) => index === screenIndex ? true : value)), [screenIndex]);
  const visitItem = (itemIndex) => setVisited((state) => ({ ...state, [screen.id]: [...new Set([...(state[screen.id] || []), itemIndex])] }));
  useEffect(() => { if (completed[screenIndex]) footerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [completed, screenIndex]);
  const goTo = (index) => {
    if (index < 0 || index >= lesson.screens.length || (index > screenIndex && !completed[screenIndex])) return;
    setScreenIndex(index); setOutlineOpen(false); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => screenIndex === lesson.screens.length - 1 ? setLessonComplete(true) : goTo(screenIndex + 1);
  const progress = Math.round((completed.filter(Boolean).length / lesson.screens.length) * 100);
  const enrichedScreen = { ...screen, lessonNumber: lesson.number };
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="course-button" type="button" onClick={() => setOutlineOpen((value) => !value)}><BookOpen /><span>{lesson.course}</span></button>
        <div className="progress-dots" aria-label={`Section ${screenIndex + 1} of ${lesson.screens.length}`}>{lesson.screens.map((entry, index) => <span key={entry.id} className={`progress-dot ${completed[index] ? "done" : ""} ${index === screenIndex ? "active" : ""}`}>{completed[index] ? <Check /> : null}</span>)}</div>
        <div className="top-actions"><button className="ghost-button" type="button" onClick={() => setSoundOn((value) => !value)}>{soundOn ? <Volume2 /> : <VolumeX />}<span>Sound {soundOn ? "on" : "off"}</span></button><button className="ghost-button" type="button"><X /><span>Quit</span></button></div>
      </header>
      <main className="workspace"><div className="lesson-stage">
        <div className="outline"><button className="menu-button" type="button" onClick={() => setOutlineOpen((value) => !value)} aria-label="Toggle lesson outline"><Menu /></button>{outlineOpen && <aside className="outline-panel"><div className="outline-summary"><strong>Lesson {lesson.number}</strong><span>{progress}% explored</span><i><b style={{ width: `${progress}%` }} /></i></div><div className="lesson-list">{lesson.screens.map((entry, index) => <button type="button" key={entry.id} className={index === screenIndex ? "current" : ""} disabled={index > 0 && !completed[index - 1]} onClick={() => goTo(index)}><span>{completed[index] ? <Check /> : index + 1}</span><strong>{entry.tab}</strong></button>)}</div></aside>}</div>
        <article className="lesson-card">
          <nav className="section-tabs" aria-label="Lesson sections"><p>SECTION {screenIndex + 1} OF {lesson.screens.length}</p><div>{lesson.screens.map((entry, index) => <button type="button" key={entry.id} className={`${index === screenIndex ? "active" : ""} ${completed[index] ? "done" : ""}`} disabled={index > 0 && !completed[index - 1]} onClick={() => goTo(index)}>{completed[index] && <Check />}<span>{entry.tab}</span></button>)}</div></nav>
          <section className="lesson-content" key={screen.id}>
            {screen.type === "reveal" && <RevealScreen screen={enrichedScreen} imageFor={imageFor} complete={completed[screenIndex]} onComplete={markComplete} />}
            {(screen.type === "cards" || screen.type === "pager") && <ExploreScreen screen={enrichedScreen} imageFor={imageFor} visited={currentVisited} onVisit={visitItem} onComplete={markComplete} />}
            {screen.type === "selfcheck" && <SelfCheckScreen screen={enrichedScreen} imageFor={imageFor} onComplete={markComplete} />}
            {screen.type === "quiz" && <QuizScreen screen={enrichedScreen} imageFor={imageFor} onComplete={markComplete} />}
          </section>
          {completed[screenIndex] && <div className="interaction-status"><Check /> Section explored. Continue when you’re ready.</div>}
          <footer className="nav-footer" ref={footerRef}><button className="secondary-button" type="button" disabled={screenIndex === 0} onClick={() => goTo(screenIndex - 1)}><ArrowLeft /> Previous</button><button className={`primary-button ${completed[screenIndex] ? "unlocked" : ""}`} type="button" disabled={!completed[screenIndex]} onClick={next}>{screenIndex === lesson.screens.length - 1 ? "Complete lesson" : "Continue"} <ArrowRight /></button></footer>
        </article>
      </div></main>
      {lessonComplete && <CompletionModal lesson={lesson} onClose={() => setLessonComplete(false)} />}
    </div>
  );
}
