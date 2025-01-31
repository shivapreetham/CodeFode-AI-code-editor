"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useState,
  useTransition,
} from "react";
import { v4 as uuid } from "uuid";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toastId, setToastId] = useState("");

  const router = useRouter();

  const notify = () => {
    toast.success("New room Id created successfully.");
  };

  const handleCreateRoom = () => {
    const id = uuid();
    setRoomId(id);
    notify();
  };

  const handleRoomId = (e: FormEvent<HTMLInputElement>) => {
    setRoomId(e.currentTarget.value);
  };

  const handleUsername = (e: FormEvent<HTMLInputElement>) => {
    setUsername(e.currentTarget.value);
  };

  const handleJoinRoom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const toastId = toast.loading("Joining...");
    setToastId(toastId);
    startTransition(() => {
      router.replace(`/room/${roomId}?username=${username}&toastId=${toastId}`);
    });
  };

  const handleInputEnter = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.code === "Enter") {
      router.replace(`/room/${roomId}?username=${username}`);
    }
  };

  useEffect(() => {
    if (!isPending && toastId) {
      toast.dismiss(toastId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  // To activate the server
  const handleServerWakeUp = async () => {
    try {
      await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL!);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    handleServerWakeUp();
  }, []);

  return (
    <main className="bg-[#17181d] flex min-h-screen flex-col items-center justify-between py-24 px-10 sm:p-24">
      <Toaster position="top-right" reverseOrder={false} />
      <div
        style={{
          background:
            "radial-gradient(circle at 65% 15%, #ea76bf 1%, #cb4bb6 30%, #bf3ab3 60%, #8b269e 100%)",
        }}
        className="w-[150px] h-[150px] absolute rounded-full -top-10 left-1/4 sm:-top-5 sm:left-1/4"
      ></div>
      <div className="z-10 w-full max-w-sm p-4 bg-transparent border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:border-gray-700">
        <form
          className="space-y-6"
          onSubmit={handleJoinRoom}
          onKeyUp={(e) => handleInputEnter(e)}
        >
          <h5 className="text-xl font-semibold text-gray-900 dark:text-white">
            Join room
          </h5>
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Room ID
            </label>
            <input
              value={roomId}
              onChange={handleRoomId}
              type="text"
              name="email"
              id="email"
              className="outline-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              placeholder="Enter room ID"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Username
            </label>
            <input
              value={username}
              onChange={handleUsername}
              type="text"
              name="password"
              id="password"
              placeholder="Enter your username"
              className="outline-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full text-white font-bold bg-gradient-to-r from-[#ad2ca0] to-[#dc64b8] hover:bg-gradient-to-br  rounded-lg text-sm px-5 py-2.5 text-center"
          >
            Join now.
          </button>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
            Don&apos;t have an invitation?{" "}
            <span
              onClick={handleCreateRoom}
              className="cursor-pointer text-[#f972d1] hover:underline"
            >
              Create room
            </span>
          </div>
        </form>
      </div>
    </main>
  );
}
