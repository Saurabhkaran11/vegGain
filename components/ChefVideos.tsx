"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { TOPICS, TOPIC_LABEL, ageHours, videoTopics, viewCount, type TopicId } from "@/lib/chef-topics";

type V = { id: string; title: string; url: string; thumb: string; views?: string; published?: string };

/** One chef's latest videos, filterable by topic and sortable by date or views. */
export function ChefVideos({ videos }: { videos: V[] }) {
  const [topic, setTopic] = useState<"all" | TopicId>("all");
  const [sort, setSort] = useState<"latest" | "views">("latest");
  const tagged = useMemo(() => videos.map((v) => ({ v, t: videoTopics(v.title) })), [videos]);
  const ids: ("all" | TopicId)[] = ["all", ...TOPICS.map((t) => t.id), "other"];
  const count = (t: "all" | TopicId) => (t === "all" ? tagged.length : tagged.filter((x) => x.t.includes(t)).length);
  const list = tagged
    .filter((x) => topic === "all" || x.t.includes(topic))
    .sort((a, b) => (sort === "views" ? viewCount(b.v.views) - viewCount(a.v.views) : ageHours(a.v.published) - ageHours(b.v.published)));

  return (
    <>
      <div className="cv-tools">
        <div className="cb-topics" role="group" aria-label="Video topic">
          {ids.map((t) => {
            const n = count(t);
            if (t !== "all" && n === 0) return null;
            return (
              <button key={t} type="button" className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>
                {t === "all" ? "All" : TOPIC_LABEL[t]} <small>{n}</small>
              </button>
            );
          })}
        </div>
        <label className="cb-sel">Sort
          <span className="selwrap">
            <select value={sort} onChange={(e) => setSort(e.target.value as "latest" | "views")}>
              <option value="latest">Newest first</option>
              <option value="views">Most viewed</option>
            </select>
          </span>
        </label>
      </div>
      <div className="video-grid">
        {list.map(({ v, t }) => (
          <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="video-card">
            <span className="vthumb">
              <Image src={v.thumb} alt="" width={480} height={360} sizes="(max-width: 640px) 100vw, 300px" />
              <span className="vplay" aria-hidden="true">▶</span>
            </span>
            <b>{v.title}</b>
            <small>{[v.views && `${v.views} views`, v.published, t[0] !== "other" && TOPIC_LABEL[t[0]]].filter(Boolean).join(" · ")}</small>
          </a>
        ))}
      </div>
    </>
  );
}
