import { models } from "./landing-copy";
import { ModelLibrary } from "./model-library";
import { Hl, Section } from "./section";

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
