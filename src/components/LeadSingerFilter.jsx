export function LeadSingerFilter({ selectedLeadSinger, onChange, songs = [] }) {
  const leadSingers = new Set();
  let leadCount = 0;

  songs.forEach((s) => {
    if (s.performanceNotes?.leadSinger) {
      leadSingers.add(s.performanceNotes.leadSinger);
    } else {
      leadCount += 1;
    }
  });

  const all = { value: 'all', label: 'All Singers', count: songs.length };
  const leadOption = { value: 'lead', label: 'Lead', count: leadCount };
  const singerOptions = Array.from(leadSingers)
    .sort()
    .map((singer) => ({
      value: singer,
      label: singer,
      count: songs.filter((s) => s.performanceNotes?.leadSinger === singer).length,
    }));

  return (
    <div className="flex gap-2 flex-wrap">
      {[all, leadOption, ...singerOptions].map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`btn btn-sm ${selectedLeadSinger === option.value ? 'btn-primary' : 'btn-ghost'}`}
        >
          {option.label}
          <span
            className={`badge badge-sm ml-1 ${selectedLeadSinger === option.value ? 'badge-primary-content' : 'badge-ghost'}`}
          >
            {option.count}
          </span>
        </button>
      ))}
    </div>
  );
}
