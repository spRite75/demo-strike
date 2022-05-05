import React from "react";

export function Button(props: { children: string; action: () => void }) {
  return (
    <button className="btn btn-primary" onClick={props.action}>
      {props.children}
    </button>
  );
}
