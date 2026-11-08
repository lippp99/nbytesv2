import { Database, KeyRound, Lock, Route } from "lucide-react";
import { privacy } from "./landing-copy";
import { Hl, Section, stagger } from "./section";

const icons = { lock: Lock, database: Database, key: KeyRound, route: Route };

export function PrivacySection() {
  return (
    <Section
      id="privasi"
      title={<>{privacy.titleBefore} <Hl>{privacy.titleMark}</Hl>{privacy.titleAfter}</>}
      lead={privacy.lead}
    >
      <ul className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-dashed lg:divide-guide">
        {privacy.points.map((point, i) => {
          const Icon = icons[point.icon as keyof typeof icons];
          return (
            <li
              key={point.title}
              data-reveal
              style={stagger(i)}
              className="lg:px-6 lg:first:pl-0 lg:last:pr-0"
            >
              <Icon aria-hidden className="size-6" strokeWidth={1.5} />
              <h3 className="mt-6 font-sans text-body font-medium">{point.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{point.body}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
