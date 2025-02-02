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
import { useSession } from "next-auth/react";
import axios from "axios";


export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toastId, setToastId] = useState("");

  const { data: session, status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") setUsername(session?.user?.email as string);
    else if(status=='loading')setUsername("Please Wait..")
    else setUsername("You Need to login");
  }, [status]);
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

    if (status === "loading") {
      // Session is still loading, don't redirect yet
      return;
    }

    // If no session and status is not "loading", redirect to login page
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  return (
    <main className="bg-gradient-to-tl from-black to-gray-700 flex min-h-screen flex-col items-center justify-center py-16 px-8 sm:px-24">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full max-w-md p-8 bg-green-500/30 backdrop-blur-lg border border-gray-200 rounded-lg shadow-xl">
        <form
          className="space-y-6"
          onSubmit={handleJoinRoom}
          onKeyUp={(e) => handleInputEnter(e)}
        >
          <h5 className="text-3xl font-semibold text-white">Join Room</h5>

          <div>
            <label
              htmlFor="roomId"
              className="block mb-2 text-sm font-medium text-white"
            >
              Room ID
            </label>
            <input
              value={roomId}
              onChange={handleRoomId}
              type="text"
              id="roomId"
              className="outline-none bg-gray-100/50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              placeholder="Enter Room ID"
              required
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block mb-2 text-sm font-medium text-white"
            >
              Username
            </label>
            <input
              value={username}
              type="text"
              id="username"
              placeholder="Enter your username"
              className="outline-none bg-gray-100/50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 block w-full p-3 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              required
              readOnly
            />
          </div>

          <button
            type="submit"
            className="w-full text-white font-bold bg-black border-gray-600 border-3 border-solid border-spacing-3 hover:bg-gray-800 rounded-lg text-sm px-6 py-3 transition-all duration-300"
          >
            Join Room
          </button>

          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
            Don&apos;t have an invitation?{" "}
            <span
              onClick={handleCreateRoom}
              className="cursor-pointer text-pink-500 hover:underline"
            >
              Create Room
            </span>
          </div>
        </form>
      </div>
    </main>
  );
}
