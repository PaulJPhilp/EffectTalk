export type XmlText = string;

export type XmlElement = {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: ReadonlyArray<XmlElement | XmlText>;
};

export type XmlDocument = {
  readonly root: XmlElement;
};
