import { useWallet } from "@mintbase-js/react";
import { Heebo } from "next/font/google";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState } from "react";
import "../style/global.css";
import { fetchImageAndConvertToBase64, runPrediction } from "@/utils/lib";
import { convertBase64ToFile } from "@/utils/base64ToFile";
import { generateRandomId } from "@/utils/generateRandomId";
import { uploadReference } from "@mintbase-js/storage";
import { constants } from "@/constants";

const heebo = Heebo({ subsets: ["latin"] });

export const AppContext = createContext<{
  cameraRef: React.MutableRefObject<any> | undefined;
  setCameraRef: (ref: React.MutableRefObject<any> | undefined) => void;
  takePicture: () => void;
  currentPhoto: boolean;
  openModal: (modalType: "default" | "rewards") => void;
  closeModal: () => void;
  isMainModalOpen: boolean;
  isRewardsModalOpen: boolean;
  mintImage: (photo: string) => void;
  isLoading: boolean;
}>({
  cameraRef: undefined,
  setCameraRef: (ref: React.MutableRefObject<any> | undefined) => null,
  takePicture: () => null,
  currentPhoto: false,
  openModal: (modalType: "default" | "rewards") => null,
  closeModal: () => null,
  isMainModalOpen: false,
  isRewardsModalOpen: false,
  mintImage: (photo: string) => null,
  isLoading: false,
});

interface IAppConsumer {
  cameraRef: string | undefined;
  setCameraRef: (ref: React.MutableRefObject<any> | undefined) => void;
  takePicture: () => void;
  currentPhoto: string | undefined;
  openModal: (modalType: "default" | "rewards") => void;
  closeModal: () => void;
  isMainModalOpen: boolean;
  isRewardsModalOpen: boolean;
  mintImage: (photo: string) => void;
  isLoading: false;
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [cameraRef, _setCameraRef] = useState<
    React.MutableRefObject<any> | undefined
  >(undefined);
  const [currentPhoto, setCurrentPhoto] = useState(false);
  const { selector, activeAccountId } = useWallet();
  const [isLoading, setLoading] = useState(false);

  const { push } = useRouter();

  const [isMainModalOpen, setMainModalOpen] = useState(false);
  const [isRewardsModalOpen, setRewardsModalOpen] = useState(false);

  const handleOpenModal = (modalType: string) => {
    if (modalType === "default") {
      setMainModalOpen(true);
    } else if (modalType === "rewards") {
      setRewardsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setMainModalOpen(false);
    setRewardsModalOpen(false);
  };

  const setCameraRef = (ref: React.MutableRefObject<any> | undefined) => {
    _setCameraRef(ref);
  };

  const takePicture = () => {
    setCurrentPhoto(true);
  };

  const _mintImage = async (photo: string) => {
    if (!activeAccountId) return null;
    const wallet = await selector.wallet();
    setLoading(true);

    const explanationPrediction = await runPrediction({
      type: "llava-13b",
      extra: {
        image: photo,
        prompt: "Describe this image. Be succint, keep it under 5 words.",
      },
    });

    const newImage = await runPrediction({
      type: "sdxl-polaroid",
      extra: {
        prompt: `Polaroid photo in the style of TOK, ${explanationPrediction.output.join("")}`,
        image: photo,
        negative_prompt:
          "deformed, worst quality, text, watermark, logo, banner, extra digits, deformed fingers, deformed hands, cropped, jpeg artefacts, signature, username, error, sketch, duplicate, ugly, monochrome, horror, geometry, mutation, disgusting",
      },
    });

    // const newImage = await runPrediction({
    //   type: "sdxl",
    //   extra: { prompt: explanationPrediction.output.join("") },
    // });

    const photo2 = await fetchImageAndConvertToBase64(newImage.output);

    const refObject = {
      title: explanationPrediction.output.join("").slice(0, 10),
      description: explanationPrediction.output.join(""),
      media: convertBase64ToFile(photo2),
    };

    const uploadedData = await uploadReference(refObject);

    const currentUrl = new URL(window.location.href);

    const protocol = currentUrl.protocol;
    const domain = currentUrl.hostname;
    const port = currentUrl.port;

    const result = await wallet?.signAndSendTransaction({
      signerId: activeAccountId,
      receiverId: constants.proxyContractAddress,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "mint",
            args: {
              metadata: JSON.stringify({
                reference: uploadedData?.id,
                extra: null,
              }),
              nft_contract_id: constants.tokenContractAddress,
            },
            gas: "200000000000000",
            deposit: "10000000000000000000000",
          },
        },
      ],
      // @ts-ignore
      successUrl: `${protocol}//${domain}${!port ? "" : ":" + port}`,
      callbackUrl: `${protocol}//${domain}${!port ? "" : ":" + port}`,
    });
  };

  return (
    <>
      {" "}
      <style jsx global>{`
        html {
          font-family: ${heebo.style.fontFamily};
        }
      `}</style>
      <AppContext.Provider
        value={{
          cameraRef,
          setCameraRef,
          takePicture,
          currentPhoto,
          openModal: handleOpenModal,
          closeModal: handleCloseModal,
          isMainModalOpen,
          isRewardsModalOpen,
          mintImage: _mintImage,
          isLoading: isLoading,
        }}
      >
        {children}
      </AppContext.Provider>
    </>
  );
};

// @ts-ignore
export const useApp = () => useContext<IAppConsumer>(AppContext);
