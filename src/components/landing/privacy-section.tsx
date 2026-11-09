import { DatabaseIcon } from "@/components/landing/shared/icons/database";
import { KeyIcon } from "@/components/landing/shared/icons/key";
import { LockIcon } from "@/components/landing/shared/icons/lock";
import { RouteIcon } from "@/components/landing/shared/icons/route";
import { privacy } from "./shared/landing-copy";
import { Hl, Section, stagger } from "./shared/section";

const icons = { lock: LockIcon, database: DatabaseIcon, key: KeyIcon, route: RouteIcon };

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
              {/* 32px: the two-tone set draws ~16-19px of its 24px box with a 40% fill, so at lucide's 24px it read small */}
              <Icon className="size-8" />
              <h3 className="mt-6 font-sans text-body font-medium">{point.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{point.body}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
