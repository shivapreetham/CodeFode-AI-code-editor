import React from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Avatar from "react-avatar";

interface PeopleProps {
  clients: any[];
  roomId: string;
}

function Peoples({ clients, roomId }: PeopleProps) {
  const router = useRouter();

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId as string);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copied the Room ID");
      console.log(err);
    }
  };

  const handleLeaveRoom = () => {
    router.replace("/");
  };

  return (
    <>
      <Toaster />
      <div className="flex md:flex-col justify-between md:h-screen p-2 md:p-4 items-center">
        <div className="md:hidden text-black w-[90px] h-8 flex items-center justify-center rounded bg-green-400">
          Joined: {clients.length}
        </div>
        <div className="w-full hidden md:flex gap-4 flex-wrap overflow-y-auto mb-5 px-2">
          <div className="text-black w-[90px] h-8 flex items-center justify-center rounded bg-green-400">
            Joined: {clients.length}
          </div>
          <div className="w-full h-[0.5px] bg-[#aaaaaa] flex flex-row"></div>
          {clients.length > 0 &&
            clients.map((client: any) => {
              return (
                <div
                  key={client.socketId}
                  className="flex flex-row items-center gap-2 px-2"
                >
                  <Avatar name={client.username} size={"30"} />
                  <p className="text-[white] mt-1">{client.username}</p>
                </div>
              );
            })}
        </div>
        <div className="flex flex-row md:w-3/4 md:mx-auto">
          <button
            onClick={handleCopyRoomId}
            type="button"
            className="h-8 w-[80px] md:w-full md:h-10 md:py-2.5 me-2 md:mb-2 text-sm font-medium  focus:outline-none rounded-lg border bg-gray-800 text-gray-400 border-gray-600 hover:text-white hover:bg-gray-700"
          >
            Copy Id
          </button>
          <button
            onClick={handleLeaveRoom}
            type="button"
            className="h-8 w-[80px] md:w-full md:h-10 text-sm md:py-2.5 me-2 md:mb-2  text-[#e5cfcf] bg-[#b81313] hover:bg-[#b81313aa] font-medium rounded-lg focus:outline-none"
          >
            Leave
          </button>
        </div>
      </div>
    </>
  );
}

export default Peoples;
