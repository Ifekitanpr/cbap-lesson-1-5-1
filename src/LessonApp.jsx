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

function BarChart({ chart }) {
  if (!chart) return null;
  return (
    <figure className="learning-chart">
      <figcaption><strong>{chart.title}</strong>{chart.caption && <span>{chart.caption}</span>}</figcaption>
      <div className="bar-chart" role="img" aria-label={chart.ariaLabel || chart.title}>
        {chart.rows.map((row) => <div className="bar-row" key={row.label}>
          <span>{row.label}</span>
          <i><b style={{ width: `${row.value}%` }} /></i>
          <strong>{row.value}%</strong>
        </div>)}
      </div>
    </figure>
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
        {content.bulletsTitle && <h4 className="detail-list-title">{content.bulletsTitle}</h4>}
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
      {screen.instruction && <div className="activity-instruction"><Target /><span>{screen.instruction}</span></div>}
      <BarChart chart={screen.chart} />
      <CardGrid items={visible} visited={visited} onOpen={setActive} />
      {allRead && screen.after && <div className="revealed-note"><strong>{screen.after.title}</strong><p>{screen.after.text}</p>{screen.after.note && <small>{screen.after.note}</small>}</div>}
      {allRead && screen.anchor && <div className="knowledge-anchor"><Target /><div><strong>Knowledge anchor</strong><p>{screen.anchor}</p></div></div>}
      {active !== null && <FocusModal content={screen.items[active]} imageFor={imageFor} onClose={() => setActive(null)} onRead={() => onVisit(active)} />}
    </div>
  );
}

function SelfCheck({ rows, scale, instruction, onDone }) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const row = rows[index];
  const finished = scores.length === rows.length;
  const choose = (score) => {
    const next = [...scores, score];
    setScores(next);
    if (next.length === rows.length) onDone(next);
    else setIndex((value) => value + 1);
  };
  if (finished) {
    const total = scores.reduce((sum, score) => sum + score, 0);
    return <div className="self-check-results">
      <div className="score-summary"><span><Check /></span><div><strong>Self-check complete</strong><p>{total} of {rows.length * 4}</p></div></div>
      <div className="score-chart" aria-label="Your self-check scores">
        {rows.map((entry, rowIndex) => <div className="score-row" key={entry.area}>
          <div><strong>{entry.area}</strong><span>{scores[rowIndex]} of 4</span></div>
          <i><b className={scores[rowIndex] < 3 ? "needs-review" : "ready"} style={{ width: `${scores[rowIndex] * 25}%` }} /></i>
          {scores[rowIndex] < 3 && <small>{entry.revisit}</small>}
        </div>)}
      </div>
    </div>;
  }
  return (
    <div className="self-check-card">
      <div className="self-check-intro"><strong>Self-check</strong><p>{instruction}</p></div>
      <div className="self-check-progress"><span>Area {index + 1} of {rows.length}</span><i><b style={{ width: `${((index + 1) / rows.length) * 100}%` }} /></i></div>
      <p className="self-check-area">{row.area}</p>
      <h2>{row.ready}</h2>
      <div className="rating-scale" aria-label={`Rate ${row.area} from 1 to 4`}>
        <div className="rating-track" aria-hidden="true"><i /></div>
        <div className="score-buttons">{scale.map((label, scoreIndex) => <button type="button" key={label} onClick={() => choose(scoreIndex + 1)}><span>{scoreIndex + 1}</span><small>{label}</small></button>)}</div>
      </div>
    </div>
  );
}

function SelfCheckScreen({ screen, imageFor, onComplete }) {
  const [focus, setFocus] = useState(null);
  const [done, setDone] = useState(false);
  return (
    <div className="grid-page">
      <ScreenHeader screen={screen} imageFor={imageFor} />
      <SelfCheck rows={screen.rows} scale={screen.scale} instruction={screen.instruction} onDone={() => { setDone(true); onComplete(); }} />
      {done && <div className="self-check-followup">
        {screen.howTo && <div className="how-to-scores"><strong>How to use your scores</strong><p>{screen.howTo}</p></div>}
        {screen.crosswalk && <section className="crosswalk-section"><h3>{screen.crosswalkTitle}</h3><p>{screen.crosswalkIntro}</p><DetailTable table={screen.crosswalk} />{screen.crosswalkCaption && <small>{screen.crosswalkCaption}</small>}</section>}
        <div className="source-actions">
          {screen.examLens && <button className="knowledge-cta" type="button" onClick={() => setFocus({ title: "Exam Lens", text: screen.examLens, image: screen.lensImage })}><Target /> Open exam lens</button>}
          {screen.summary && <button className="knowledge-retake" type="button" onClick={() => setFocus({ title: screen.summaryTitle, text: screen.summary })}>Open framework crosswalk</button>}
        </div>
      </div>}
      {focus && <FocusModal content={focus} imageFor={imageFor} onClose={() => setFocus(null)} onRead={() => {}} action="Done" />}
    </div>
  );
}

function KnowledgeCheckModal({ questions, startIndex, onClose, onFinish }) {
  const [questionIndex, setQuestionIndex] = useState(startIndex);
  const [picked, setPicked] = useState(null);
  const question = questions[questionIndex];
  const last = questionIndex === questions.length - 1;
  const advance = () => {
    if (last) onFinish();
    else { setQuestionIndex((value) => value + 1); setPicked(null); }
  };
  return createPortal(
    <div className="knowledge-backdrop">
      <section className="knowledge-modal" role="dialog" aria-modal="true" aria-labelledby="knowledge-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        <p className="quiz-label"><Target /> MICRO KNOWLEDGE CHECK · {questionIndex + 1} OF {questions.length}</p>
        <h3 id="knowledge-title">{question.question}</h3>
        <div className="answers">{question.answers.map((answer, index) => {
          const revealed = picked !== null;
          const state = revealed && index === question.correct ? "correct" : picked === index ? "wrong" : "";
          return <button type="button" key={answer} className={state} disabled={revealed} onClick={() => setPicked(index)}><span>{String.fromCharCode(65 + index)}</span>{answer}</button>;
        })}</div>
        {picked !== null && <div className="answer-reveal"><strong>Answer</strong><p>{question.feedback}</p></div>}
        {picked !== null && <button className="finish-check" type="button" onClick={advance}>{last ? "Finish check" : "Next check"} <ArrowRight /></button>}
      </section>
    </div>,
    document.body,
  );
}

function QuizScreen({ screen, imageFor, onComplete }) {
  const [quizOpen, setQuizOpen] = useState(false);
  const [checksDone, setChecksDone] = useState(false);
  const [selfDone, setSelfDone] = useState(false);
  const [lens, setLens] = useState(false);
  useEffect(() => { if (checksDone && selfDone) onComplete(); }, [checksDone, selfDone, onComplete]);
  return (
    <div className="grid-page">
      <ScreenHeader screen={screen} imageFor={imageFor} />
      {!checksDone ? (
        <div className="knowledge-launch">
          <div><p className="quiz-step"><Target /> Knowledge checks</p><h2>Three single-answer scenario questions</h2><p>{screen.quizInstruction}</p></div>
          <button className="knowledge-cta" type="button" onClick={() => setQuizOpen(true)}><Target /> Start knowledge check <ArrowRight /></button>
        </div>
      ) : !selfDone ? (
        <div className="lock-in-self-check"><div className="knowledge-actions completed"><div className="knowledge-complete"><span><Check /></span><div><strong>Knowledge check completed</strong><small>All three answer panels reviewed</small></div></div><button className="knowledge-cta" type="button" disabled><Check /> Completed</button></div><SelfCheck rows={screen.rows} scale={screen.scale} instruction={screen.selfCheckInstruction} onDone={() => setSelfDone(true)} /></div>
      ) : (
        <div className="knowledge-actions completed"><div className="knowledge-complete"><span><Check /></span><div><strong>Lock It In complete</strong><small>Three checks and the self-check completed</small></div></div><div className="knowledge-action-buttons"><button className="knowledge-cta" type="button" disabled><Check /> Completed</button><button className="knowledge-retake" type="button" onClick={() => setLens(true)}>Open exam lens</button></div></div>
      )}
      {quizOpen && <KnowledgeCheckModal questions={screen.quiz} startIndex={0} onClose={() => setQuizOpen(false)} onFinish={() => { setChecksDone(true); setQuizOpen(false); }} />}
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
