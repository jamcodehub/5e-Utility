import Journal from './Journal'

export default function SessionPlanner() {
  return (
    <Journal
      entryType="session"
      entryLabel="Session"
      pageTitle="Session Planner"
      emptyHint="No sessions yet."
      selectHint="No session selected. Start a new one with +"
    />
  )
}
