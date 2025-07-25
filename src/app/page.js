"use client";
import { useState, useRef, useCallback } from "react";
import { signOut } from "next-auth/react"
import Image from "next/image";
import { faImages, faTrashAlt, faUpload, faSearchPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import { useEffect } from 'react';
import Footer from '@/components/Footer'
import Link from "next/link";
import LoadingOverlay from "@/components/LoadingOverlay";


const LoginButton = ({ onClick, href, children }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 mx-2 w-28 sm:w-28 md:w-20 lg:w-16 xl:w-16 2xl:w-20 bg-blue-500 text-white rounded"
  >
    {children}
  </button>
);


export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFilesNum, setUploadedFilesNum] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null); // 添加状态用于跟踪选中的放大图片
  const [activeTab, setActiveTab] = useState('preview');
  const [uploading, setUploading] = useState(false);
  const [IP, setIP] = useState('');
  const [Total, setTotal] = useState('?');
  const [selectedOption, setSelectedOption] = useState('tgchannel'); // 初始选择第一个选项
  const [isAuthapi, setisAuthapi] = useState(false); // 初始选择第一个选项
  const [Loginuser, setLoginuser] = useState(''); // 初始选择第一个选项
  const [boxType, setBoxtype] = useState("img");

  const origin = typeof window !== 'undefined' ? window.location.origin : '';


  const parentRef = useRef(null);






  let headers = {

    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",

  }
  useEffect(() => {
    ip();
    getTotal();
    isAuth();


  }, []);
  const ip = async () => {
    try {

      const res = await fetch(`/api/ip`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json'
        }

      });
      const data = await res.json();
      setIP(data.ip);



    } catch (error) {
      console.error('请求出错:', error);
    }
  };
  const isAuth = async () => {
    try {

      const res = await fetch(`/api/enableauthapi/isauth`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json'
        }

      });

      if (res.ok) {
        const data = await res.json();
        setisAuthapi(true)
        setLoginuser(data.role)

      } else {
        setisAuthapi(false)
        setSelectedOption("58img")
      }



    } catch (error) {
      console.error('请求出错:', error);
    }
  };

  const getTotal = async () => {
    try {

      const res = await fetch(`/api/total`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json'
        }

      });
      const data = await res.json();
      setTotal(data.total);



    } catch (error) {
      console.error('请求出错:', error);
    }
  }

  const handleFileChange = (event) => {
    const newFiles = event.target.files;
    const filteredFiles = Array.from(newFiles).filter(file =>
      !selectedFiles.find(selFile => selFile.name === file.name));
    // 过滤掉已经在 uploadedImages 数组中存在的文件
    const uniqueFiles = filteredFiles.filter(file =>
      !uploadedImages.find(upImg => upImg.name === file.name)
    );

    setSelectedFiles([...selectedFiles, ...uniqueFiles]);
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setUploadStatus('');
    // setUploadedImages([]);
  };

  const getTotalSizeInMB = (files) => {
    const totalSizeInBytes = Array.from(files).reduce((acc, file) => acc + file.size, 0);
    return (totalSizeInBytes / (1024 * 1024)).toFixed(2); // 转换为MB并保留两位小数
  };



  const handleUpload = async (file = null) => {
    setUploading(true);

    const filesToUpload = file ? [file] : selectedFiles;

    if (filesToUpload.length === 0) {
      toast.error('请选择要上传的文件');
      setUploading(false);
      return;
    }

    const formFieldName = selectedOption === "tencent" ? "media" : "file";
    let successCount = 0;

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();

        formData.append(formFieldName, file);

        try {
          const targetUrl = selectedOption === "tgchannel" || selectedOption === "r2"
            ? `/api/enableauthapi/${selectedOption}`
            : `/api/${selectedOption}`;

          // const response = await fetch("https://img.131213.xyz/api/tencent", {
          const response = await fetch(targetUrl, {
            method: 'POST',
            body: formData,
            headers: headers
          });

          if (response.ok) {
            const result = await response.json();
            // console.log(result);

            file.url = result.url;

            // 更新 uploadedImages 和 selectedFiles
            setUploadedImages((prevImages) => [...prevImages, file]);
            setSelectedFiles((prevFiles) => prevFiles.filter(f => f !== file));
            successCount++;
          } else {
            // 尝试从响应中提取错误信息
            let errorMsg;
            try {
              const errorData = await response.json();
              errorMsg = errorData.message || `上传 ${file.name} 图片时出错`;
            } catch (jsonError) {
              // 如果解析 JSON 失败，使用默认错误信息
              errorMsg = `上传 ${file.name} 图片时发生未知错误`;
            }

            // 细化状态码处理
            switch (response.status) {
              case 400:
                toast.error(`请求无效: ${errorMsg}`);
                break;
              case 403:
                toast.error(`无权限访问资源: ${errorMsg}`);
                break;
              case 404:
                toast.error(`资源未找到: ${errorMsg}`);
                break;
              case 500:
                toast.error(`服务器错误: ${errorMsg}`);
                break;
              case 401:
                toast.error(`未授权: ${errorMsg}`);
                break;
              default:
                toast.error(`上传 ${file.name} 图片时出错: ${errorMsg}`);
            }
          }
        } catch (error) {
          toast.error(`上传 ${file.name} 图片时出错`);
        }
      }

      setUploadedFilesNum(uploadedFilesNum + successCount);
      toast.success(`已成功上传 ${successCount} 张图片`);

    } catch (error) {
      console.error('上传过程中出现错误:', error);
      toast.error('上传错误');
    } finally {
      setUploading(false);
    }
  };





  const handlePaste = (event) => {
    const clipboardItems = event.clipboardData.items;

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.kind === 'file' && item.type.includes('image')) {
        const file = item.getAsFile();
        setSelectedFiles([...selectedFiles, file]);
        break; // 只处理第一个文件
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;

    if (files.length > 0) {
      const filteredFiles = Array.from(files).filter(file => !selectedFiles.find(selFile => selFile.name === file.name));
      setSelectedFiles([...selectedFiles, ...filteredFiles]);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // 根据图片数量动态计算容器高度
  const calculateMinHeight = () => {
    const rows = Math.ceil(selectedFiles.length / 4);
    return `${rows * 100}px`;
  };

  // 处理点击图片放大
  const handleImageClick = (index) => {

    if (selectedFiles[index].type.startsWith('image/')) {
      setBoxtype("img");
    } else if (selectedFiles[index].type.startsWith('video/')) {
      setBoxtype("video");
    } else {
      setBoxtype("other");
    }

    setSelectedImage(URL.createObjectURL(selectedFiles[index]));
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const handleRemoveImage = (index) => {
    const updatedFiles = selectedFiles.filter((_, idx) => idx !== index);
    setSelectedFiles(updatedFiles);
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // alert('已成功复制到剪贴板');
      toast.success(`链接复制成功`);
    } catch (err) {
      toast.error("链接复制失败")
    }
  };

  const handleCopyCode = async () => {
    const codeElements = parentRef.current.querySelectorAll('code');
    const values = Array.from(codeElements).map(code => code.textContent);
    try {
      await navigator.clipboard.writeText(values.join("\n"));
      toast.success(`链接复制成功`);

    } catch (error) {
      toast.error(`链接复制失败\n${error}`)
    }
  }

  const handlerenderImageClick = (imageUrl, type) => {
    setBoxtype(type);
    setSelectedImage(imageUrl);
  };


  const renderFile = (data, index) => {
    const fileUrl = data.url;
    if (data.type.startsWith('image/')) {
      return (
        <img
          key={`image-${index}`}
          src={data.url}
          alt={`Uploaded ${index}`}
          className="object-cover w-36 h-40 m-2"
          onClick={() => handlerenderImageClick(fileUrl, "img")}
        />
      );

    } else if (data.type.startsWith('video/')) {
      return (
        <video
          key={`video-${index}`}
          src={data.url}
          className="object-cover w-36 h-40 m-2"
          controls
          onClick={() => handlerenderImageClick(fileUrl, "video")}
        >
          Your browser does not support the video tag.
        </video>
      );

    } else {
      // 其他文件类型
      return (
        <img
          key={`image-${index}`}
          src={data.url}
          alt={`Uploaded ${index}`}
          className="object-cover w-36 h-40 m-2"
          onClick={() => handlerenderImageClick(fileUrl, "other")}
        />
      );
    }



  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'preview':
        return (
          <div className=" flex flex-col ">
            {uploadedImages.map((data, index) => (
              <div key={index} className="m-2 rounded-2xl ring-offset-2 ring-2  ring-slate-100 flex flex-row ">
                {renderFile(data, index)}
                <div className="flex flex-col justify-center w-4/5">
                  {[
                    { text: data.url, onClick: () => handleCopy(data.url) },
                    { text: `![${data.name}](${data.url})`, onClick: () => handleCopy(`![${data.name}](${data.url})`) },
                    { text: `<a href="${data.url}" target="_blank"><img src="${data.url}"></a>`, onClick: () => handleCopy(`<a href="${data.url}" target="_blank"><img src="${data.url}"></a>`) },
                    { text: `[img]${data.url}[/img]`, onClick: () => handleCopy(`[img]${data.url}[/img]`) },
                  ].map((item, i) => (
                    <input
                      key={`input-${i}`}
                      readOnly
                      value={item.text}
                      onClick={item.onClick}
                      className="px-3 my-1 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-800 focus:outline-none placeholder-gray-400"
                    />
                  ))}
                </div>
              </div>

            ))}
          </div>
        );
      case 'htmlLinks':
        return (
          <div ref={parentRef} className=" p-4 bg-slate-100  " onClick={handleCopyCode}>
            {uploadedImages.map((data, index) => (
              <div key={index} className="mb-2 ">
                <code className=" w-2 break-all">{`<img src="${data.url}" alt="${data.name}" />`}</code>
              </div>
            ))}
          </div >
        );
      case 'markdownLinks':
        return (
          <div ref={parentRef} className=" p-4 bg-slate-100  " onClick={handleCopyCode}>
            {uploadedImages.map((data, index) => (
              <div key={index} className="mb-2">
                <code className=" w-2 break-all">{`![${data.name}](${data.url})`}</code>
              </div>
            ))}
          </div>
        );
      case 'bbcodeLinks':
        return (
          <div ref={parentRef} className=" p-4 bg-slate-100  " onClick={handleCopyCode}>
            {uploadedImages.map((data, index) => (
              <div key={index} className="mb-2">
                <code className=" w-2 break-all">{`[img]${data.url}[/img]`}</code>
              </div>
            ))}
          </div>
        );
      case 'viewLinks':
        return (
          <div ref={parentRef} className=" p-4 bg-slate-100  " onClick={handleCopyCode}>
            {uploadedImages.map((data, index) => (
              <div key={index} className="mb-2">
                <code className=" w-2 break-all">{`${data.url}`}</code>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const handleSelectChange = (e) => {
    setSelectedOption(e.target.value); // 更新选择框的值
  };


  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const renderButton = () => {
    if (!isAuthapi) {
      return (
        <Link href="/login">
          <LoginButton>登录</LoginButton>
        </Link>
      );
    }
    switch (Loginuser) {
      case 'user':
        return <LoginButton onClick={handleSignOut}>登出</LoginButton>;
      case 'admin':
        return (
          <Link href="/admin">
            <LoginButton>管理</LoginButton>
          </Link>
        );
      default:
        return (
          <Link href="/login">
            <LoginButton>登录</LoginButton>
          </Link>
        );
    }
  };


  return (
    <main className=" overflow-auto h-full flex w-full min-h-screen flex-col items-center justify-between">
      <header className="fixed top-0 h-[50px] left-0 w-full border-b bg-white flex z-50 justify-center items-center">
        <nav className="flex justify-between items-center w-full max-w-4xl px-4">图床</nav>
        {renderButton()}
      </header>
      <div className="mt-[60px] w-9/10 sm:w-9/10 md:w-9/10 lg:w-9/10 xl:w-3/5 2xl:w-2/3">

        <div className="flex flex-row">
          <div className="flex flex-col">
            <div className="text-gray-800 text-lg">图片或视频上传
            </div>
            <div className="mb-4 text-sm text-gray-500">
              上传文件最大 5 MB;本站已托管 <span className="text-cyan-600">{Total}</span> 张图片; 你访问本站的IP是：<span className="text-cyan-600">{IP}</span>
            </div>
          </div>
          <div className="flex  flex-col sm:flex-col   md:w-auto lg:flex-row xl:flex-row  2xl:flex-row  mx-auto items-center  ">
            <span className=" text-lg sm:text-sm   md:text-sm lg:text-xl xl:text-xl  2xl:text-xl">上传接口：</span>
            <select
              value={selectedOption} // 将选择框的值绑定到状态中的 selectedOption
              onChange={handleSelectChange} // 当选择框的值发生变化时触发 handleSelectChange 函数
              className="text-lg p-2 border  rounded text-center w-auto sm:w-auto md:w-auto lg:w-auto xl:w-auto  2xl:w-36">
              {/*<option value="tg" >TG(会失效)</option> */}
              <option value="tgchannel">TG_Channel</option>
              {/*<option value="r2">R2</option> */}
              {/* <option value="vviptuangou">vviptuangou</option> */}
              {/* <option value="58img">58img</option> */}
              {/* <option value="tencent">tencent</option> */}

            </select>
          </div>


        </div>
        <div
          className="border-2 border-dashed border-slate-400 rounded-md relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onPaste={handlePaste}
          style={{ minHeight: calculateMinHeight() }} // 动态设置最小高度
        >
          <div className="flex flex-wrap gap-3 min-h-[240px]">
            <LoadingOverlay loading={uploading} />
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative rounded-2xl w-44 h-48 ring-offset-2 ring-2  mx-3 my-3 flex flex-col items-center">
                <div className="relative w-36 h-36 " onClick={() => handleImageClick(index)}>
                  {file.type.startsWith('image/') && (
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${file.name}`}
                      fill={true}
                    />
                  )}
                  {file.type.startsWith('video/') && (
                    <video
                      src={URL.createObjectURL(file)}
                      controls
                      className="w-full h-full"
                    />
                  )}
                  {!file.type.startsWith('image/') && !file.type.startsWith('video/') && (
                    <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-700">
                      <p>{file.name}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-row items-center  justify-center w-full mt-3">
                  <button
                    className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer mx-2"
                    onClick={() => handleImageClick(index)}
                  >
                    <FontAwesomeIcon icon={faSearchPlus} />
                  </button>
                  <button
                    className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer mx-2"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} />
                  </button>
                  <button
                    className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer mx-2"

                    onClick={() => handleUpload(file)}
                  >
                    <FontAwesomeIcon icon={faUpload} />
                  </button>
                </div>
              </div>
            ))}


            {selectedFiles.length === 0 && (
              <div className="absolute -z-10 left-0 top-0 w-full h-full flex items-center justify-center">

                <div className="text-gray-500">

                  拖拽文件到这里或将屏幕截图复制并粘贴到此处上传
                </div>
              </div>
            )}

          </div>
        </div>
        <div className="w-full rounded-md shadow-sm overflow-hidden mt-4 grid grid-cols-8">
          <div className="md:col-span-1 col-span-8">
            <label
              htmlFor="file-upload"
              className="w-full h-10 bg-blue-500 cursor-pointer flex items-center justify-center text-white"
            >
              <FontAwesomeIcon icon={faImages} style={{ width: '20px', height: '20px' }} className="mr-2" />
              选择图片
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              multiple
            />
          </div>
          <div className="md:col-span-5 col-span-8">
            <div className="w-full h-10 bg-slate-200 leading-10 px-4 text-center md:text-left">
              已选择 {selectedFiles.length} 张，共 {getTotalSizeInMB(selectedFiles)} M
            </div>
          </div>
          <div className="md:col-span-1 col-span-3">
            <div
              className="w-full bg-red-500 cursor-pointer h-10 flex items-center justify-center text-white"
              onClick={handleClear}
            >
              <FontAwesomeIcon icon={faTrashAlt} style={{ width: '20px', height: '20px' }} className="mr-2" />
              清除
            </div>
          </div>
          <div className="md:col-span-1 col-span-5">
            <div
              className={`w-full bg-green-500 cursor-pointer h-10 flex items-center justify-center text-white ${uploading ? 'pointer-events-none opacity-50' : ''}`}
              // className={`bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer mx-2 ${uploading ? 'pointer-events-none opacity-50' : ''}`}

              onClick={() => handleUpload()}
            >
              <FontAwesomeIcon icon={faUpload} style={{ width: '20px', height: '20px' }} className="mr-2" />
              上传
            </div>
          </div>
        </div>


        <ToastContainer />
        <div className="w-full mt-4 min-h-[200px] mb-[60px] ">

          {
            uploadedImages.length > 0 && (<>
              <div className="flex flex-wrap gap-3 mb-4 border-b border-gray-300 ">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 ${activeTab === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('htmlLinks')}
                  className={`px-4 py-2 ${activeTab === 'htmlLinks' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  HTML
                </button>
                <button
                  onClick={() => setActiveTab('markdownLinks')}
                  className={`px-4 py-2 ${activeTab === 'markdownLinks' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  Markdown
                </button>
                <button
                  onClick={() => setActiveTab('bbcodeLinks')}
                  className={`px-4 py-2 ${activeTab === 'bbcodeLinks' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  BBCode
                </button>
                <button
                  onClick={() => setActiveTab('viewLinks')}
                  className={`px-4 py-2 ${activeTab === 'viewLinks' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  Links
                </button>
              </div>
              {renderTabContent()}
            </>
            )
          }
        </div>

      </div>
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseImage}>
          <div className="relative flex flex-col items-center justify-between">
            <button
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
              onClick={handleCloseImage}
            >
              &times;
            </button>

            {boxType === "img" ? (
              <img
                src={selectedImage}
                alt="Selected"
                width={500}
                height={500}
                className="object-cover w-9/10  h-auto rounded-lg"
              />
            ) : boxType === "video" ? (
              <video
                src={selectedImage}
                width={500}
                height={500}
                className="object-cover w-9/10  h-auto rounded-lg"
                controls
              />
            ) : boxType === "other" ? (
              // 这里可以渲染你想要的其他内容或组件
              <div className="p-4 bg-white text-black rounded">
                <p>Unsupported file type</p>
              </div>
            ) : (
              // 你可以选择一个默认的内容或者返回 null
              <div>未知类型</div>
            )}
          </div>

        </div>

      )}

      <div className="fixed inset-x-0 bottom-0 h-[50px] bg-slate-200  w-full  flex  z-50 justify-center items-center ">
        <Footer />
      </div>
    </main>
  );
}
