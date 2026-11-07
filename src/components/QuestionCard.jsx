import ReactionBar from './ReactionBar.jsx';
import Comments from './Comments.jsx';
import { Avatar, Verified, timeAgo } from './ui.jsx';

export default function QuestionCard({ item }) {
  const { answer } = item;

  return (
    <article className="animate-rise space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex gap-3">
        <Avatar name={item.user_name} size="h-10 w-10" />
        <div className="min-w-0">
          <p className="text-xs text-gray-400">
            <span className="font-bold text-gray-700">{item.user_name}</span> asked · {timeAgo(item.created_at)}
          </p>
          <h2 className="mt-0.5 break-words text-[15px] font-bold leading-snug">{item.question_text}</h2>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-100">
        <div className="mb-2 flex items-center gap-2">
          <Avatar name="A" brand ring size="h-8 w-8" />
          <span className="flex items-center gap-1 text-sm font-bold text-emerald-900">
            Aussie Connect <Verified className="h-3.5 w-3.5" />
          </span>
          <span className="ml-auto text-xs text-emerald-700/70">{timeAgo(answer.created_at)}</span>
        </div>
        <p className="whitespace-pre-line break-words text-sm leading-relaxed text-emerald-950">{answer.answer_text}</p>
      </div>

      <ReactionBar targetType="answer" targetId={answer.id} initialCounts={answer.reactions} />

      <Comments target="answer" targetId={answer.id} initial={answer.comments} />
    </article>
  );
}