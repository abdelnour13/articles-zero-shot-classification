import { useState } from "react";
import type { Label } from "../types";

export type useLabelsReturn = [
    Label[],
    string,
    string,
    (name: string, description: string) => void,
    (id: number) => void,
    () => void,
    React.Dispatch<React.SetStateAction<string>>,
    React.Dispatch<React.SetStateAction<string>>
];

export function useLabels(): useLabelsReturn {
  const [labels, setLabels] = useState<Label[]>([]);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const addLabel = (name: string, description: string) => {
    setLabels([...labels, { name: name, description: description }]);
    setName("");
    setDescription("");
  };

  const removeLabel = (idx: number) => {
    setLabels(labels.filter((_v, id) => id !== idx));
  };

  const clear = () => setLabels([]);

  return [
      labels,
      name,
      description,
      addLabel,
      removeLabel,
      clear,
      setName,
      setDescription,
  ];
}
