"use client";

import React, { useEffect, useState } from "react";
import Heading from "./_components/Heading";
import { Button, Textarea, Snippet, Tooltip } from "@nextui-org/react";
import { apiGet, apiPost, apiDelete } from "./_components/api";
import { usePrompt } from "./_components/PromptContext";
import { InboxOutlined, TeamOutlined, GithubOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import ActionButton from "./_components/ActionButton";

export default function Home() {
  const prompt = usePrompt();
  const [stage, setStage] = useState<
    "submit" | "showId" | "showMatches" | "showMessages"
  >("submit");
  const [text, setText] = useState("");
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [secretKey, setSecretKey] = useState<string | null>(null);

  const askForSecretKey = async () => {
    const result = await prompt("Enter your secret key", [
      {
        key: "secretKey",
        label: "Secret key",
      },
    ]);
    if (result) {
      setSecretKey(result.secretKey);
      return true;
    }
  };

  const loadMessages = async () => {
    setMessagesLoading(true);
    try {
      const messages = await apiGet("/messages", {
        toSecretKey: secretKey,
      });
      setMessages(messages);
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadMatches = async () => {
    setMatchesLoading(true);
    try {
      const matches = await apiGet("/matches", { secretKey, topK: 10 });
      setMatches(matches);
    } finally {
      setMatchesLoading(false);
    }
  };

  const sendMessage = async (
    toSubmissionId: string,
    text: string,
    useLoadingToast?: boolean
  ) => {
    const apiPromise = apiPost("/messages", {
      text,
      fromSecretKey: secretKey,
      toSubmissionId,
    });
    if (useLoadingToast) {
      toast.promise(apiPromise, {
        loading: "Sending message...",
        success: "Message sent!",
        error: "Failed to send message",
      });
    } else {
      await apiPromise;
      toast.success("Message sent!");
    }
  };

  const loadSenderSubmission = async (submissionId: string) => {
    const submission = await apiGet("/submission", {
      id: submissionId,
    });
    prompt(undefined, [
      {
        key: "submission",
        multiLine: true,
        defaultValue: submission.text,
        readOnly: true,
      },
    ]);
  };

  useEffect(() => {
    if (stage === "showMatches" && secretKey) {
      loadMatches();
    } else if (stage === "showMessages" && secretKey) {
      loadMessages();
    }
  }, [stage, secretKey]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-3 py-32 max-w-md mx-auto">
      <div className="fixed top-4 right-4 flex flex-col gap-2">
        <Tooltip content="View private messages" placement="left">
          <Button
            isIconOnly
            onClick={async () => {
              if (await askForSecretKey()) {
                setStage("showMessages");
              }
            }}
          >
            <InboxOutlined />
          </Button>
        </Tooltip>
        <Tooltip content="View matches" placement="left">
          <Button
            isIconOnly
            onClick={async () => {
              if (await askForSecretKey()) {
                setStage("showMatches");
              }
            }}
          >
            <TeamOutlined />
          </Button>
        </Tooltip>
        <Tooltip content="View on GitHub" placement="left">
          <Button
            isIconOnly
            onClick={() =>
              window.open("https://github.com/hermesloom/matchmind", "_blank")
            }
          >
            <GithubOutlined />
          </Button>
        </Tooltip>
      </div>

      {stage === "submit" && (
        <>
          <Heading>
            What's one thing where you normally feel least understood?
          </Heading>
          <Textarea
            className="w-full mt-4"
            minRows={4}
            size="lg"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            color="primary"
            className="mt-4 px-8"
            size="lg"
            onClick={async () => {
              setSubmissionLoading(true);
              try {
                const { secretKey } = await apiPost("/submission", { text });
                setSecretKey(secretKey);
                setStage("showId");
                setText("");
              } finally {
                setSubmissionLoading(false);
              }
            }}
            isDisabled={text.length === 0}
            isLoading={submissionLoading}
          >
            Submit
          </Button>
        </>
      )}
      {stage === "showId" && (
        <>
          <Heading>The secret key for your submission is:</Heading>
          <Snippet symbol="">{secretKey}</Snippet>
          <p className="mt-4">
            Store it, in case you want to keep access to it.
          </p>
          <Button
            color="primary"
            className="mt-4 px-8"
            size="lg"
            onClick={() => setStage("showMatches")}
          >
            Show matches
          </Button>
        </>
      )}
      {stage === "showMatches" && (
        <>
          <Heading>
            These people responded similarly. Click on one to send them a
            message.
          </Heading>
          {matchesLoading ? null : matches.length > 0 ? (
            matches.map((m) => (
              <Textarea
                key={m.id}
                className="w-full mt-4"
                minRows={4}
                size="lg"
                readOnly
                value={m.text}
                onClick={async () => {
                  const resp = await prompt(
                    "Write a message to the person that submitted this. They will see what you submitted before.",
                    [
                      {
                        key: "message",
                        label: "Message",
                        multiLine: true,
                      },
                    ]
                  );
                  if (resp) {
                    sendMessage(m.id, resp.message, true);
                  }
                }}
              />
            ))
          ) : (
            <p className="mt-2">No matches.</p>
          )}
          <div className="flex justify-center gap-6 mt-6">
            <Button size="lg" isLoading={matchesLoading} onClick={loadMatches}>
              Reload
            </Button>
            <Button
              color="primary"
              size="lg"
              onClick={() => setStage("submit")}
            >
              Go back
            </Button>
          </div>
        </>
      )}
      {stage === "showMessages" && (
        <>
          <Heading>Private messages you received.</Heading>
          {messagesLoading ? null : messages.length > 0 ? (
            messages.map((m) => (
              <div key={m.id} className="w-full mt-8 mb-4">
                <Textarea
                  value={m.text}
                  className="w-full"
                  minRows={4}
                  size="lg"
                  readOnly
                />
                <div className="flex gap-2 mt-2 justify-center">
                  <ActionButton
                    color="primary"
                    size="sm"
                    action={{
                      key: "reply",
                      label: "Reply",
                      onClick: {
                        prompt: () =>
                          prompt("Write a reply.", [
                            {
                              key: "message",
                              label: "Message",
                              multiLine: true,
                            },
                          ]),
                        handler: (_, resp: any) =>
                          sendMessage(m.from_submission_id, resp.message),
                      },
                    }}
                  />
                  <ActionButton
                    size="sm"
                    action={{
                      key: "view-sender-submission",
                      label: "View sender's submission",
                      onClick: () => loadSenderSubmission(m.from_submission_id),
                    }}
                  />
                  <ActionButton
                    size="sm"
                    color="danger"
                    action={{
                      key: "delete",
                      label: "Delete",
                      onClick: async () => {
                        await apiDelete("/messages", { id: m.id });
                        setMessages(
                          messages.filter((other) => other.id !== m.id)
                        );
                        toast.success("Message deleted!");
                      },
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="mt-2">No messages.</p>
          )}
          <div className="flex justify-center gap-6 mt-6">
            <Button
              size="lg"
              isLoading={messagesLoading}
              onClick={loadMessages}
            >
              Reload
            </Button>
            <Button
              color="primary"
              size="lg"
              onClick={() => setStage("submit")}
            >
              Go back
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
