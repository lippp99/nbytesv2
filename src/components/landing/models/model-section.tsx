import { models } from "../shared/landing-copy";
import { ModelLibrary } from "./model-library";
import { Hl, Section } from "../shared/section";

export function ModelSection() {
  return (
    <Section
      id="model"
      title={<>{models.titleBefore} <Hl>{models.titleMark}</Hl></>}
      lead={models.lead}
    >
      <ModelLibrary />
    </Section>
  );
}
