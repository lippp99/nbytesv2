import { PlusIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { focusRing, textLink } from "@/components/button-styles";
import { faq, footer } from "./landing-copy";
import { mockFaq } from "./landing-mock-data";
import { Hl, Section, stagger } from "./section";

// The shadcn trigger ships chevrons; a plus that turns into a cross matches the references, so the trigger is composed here.
const trigger =
  "group/faq flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left text-lead font-medium transition-colors " +
  `hover:text-muted-foreground ${focusRing}`;

export function FaqSection() {
  return (
    <Section
      id="faq"
      split
      title={<>{faq.titleBefore} <Hl>{faq.titleMark}</Hl></>}
      lead={
        <>
          {faq.more}{" "}
          <a href={`mailto:${footer.contact}`} className={`${textLink} text-foreground`}>{footer.contact}</a>.
        </>
      }
    >
      <Accordion className="border-t border-dashed border-guide">
        {mockFaq.map((item, i) => (
          <AccordionItem key={item.q} value={item.q} data-reveal style={stagger(i)} className="border-b border-dashed border-guide not-last:border-b">
            <AccordionPrimitive.Header>
              <AccordionPrimitive.Trigger className={trigger}>
                {item.q}
                <PlusIcon
                  aria-hidden
                  strokeWidth={1.5}
                  className="size-5 shrink-0 transition-transform duration-300 ease-out-expo group-aria-expanded/faq:rotate-45"
                />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionContent className="pb-6 text-body text-muted-foreground">
              <p className="max-w-prose">{item.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
