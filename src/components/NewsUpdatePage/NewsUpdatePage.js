import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, orderBy, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import styles from './NewsUpdatePage.module.css';
import Sidebar from '../Sidebar/Sidebar';


const NewsUpdatePage = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [title_en, setTitle_en] = useState('');
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editing, setEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(null);
  const contentRef = useRef(null);

  const fetchNews = async () => {
    const newsQuery = query(collection(db, 'News'), orderBy('timestamp', 'desc'));
    const newsSnapshot = await getDocs(newsQuery);
    const newsData = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setNewsItems(newsData);
  };

  useEffect(() => {
    fetchNews();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleClickOutside = (event) => {
    if (!event.target.closest(`.${styles.dropdown}`)) {
      setDropdownVisible(null);
    }
  };

  const cleanContent = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.querySelectorAll('div:empty, br').forEach(el => el.remove());
    return tempDiv.innerHTML;
  };

  const handleUpload = async () => {
    if (!title_en || !content) {
      alert('Title and content are required');
      return;
    }
    console.log('Media Items before saving:', mediaItems);
    await saveNews(mediaItems);
  };

  const saveNews = async (mediaItems) => {
    const cleanedContent = cleanContent(contentRef.current.innerHTML);
    const newsItem = {
      title_en,
      newsItems: [
        {
          type: 'text',
          content_en: cleanedContent,
          content_es: '',
          content_it: '',
          content_ru: '',
          content_zh: ''
        },
        ...mediaItems
      ],
      timestamp: new Date()
    };

    console.log('Saving news item:', newsItem);

    if (editing) {
      const newsDocRef = doc(db, 'News', currentEditId);
      await updateDoc(newsDocRef, newsItem);
      setEditing(false);
      setCurrentEditId(null);
    } else {
      await addDoc(collection(db, 'News'), newsItem);
    }

    // Clear the state and content editor after saving
    setTitle_en('');
    setContent('');
    setMediaItems([]);
    setUploadProgress(0);
    contentRef.current.innerHTML = '';
    fetchNews();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'News', id));
    fetchNews();
  };

  const handleEdit = (item) => {
    setEditing(true);
    setCurrentEditId(item.id);
    setTitle_en(item.title_en || '');
    const textContent = item.newsItems.find(i => i.type === 'text');
    const editor = contentRef.current;
    editor.innerHTML = '';
    const newMediaItems = item.newsItems.filter(i => i.type !== 'text');

    if (textContent) {
      setContent(textContent.content_en);
      editor.innerHTML = textContent.content_en;
    }
    newMediaItems.forEach(newsItem => {
      if (newsItem.type === 'image') {
        insertImage(newsItem.url, false);
      } else if (newsItem.type === 'video') {
        insertVideo(newsItem.url, false);
      }
    });
    setMediaItems(newMediaItems);
  };

  const insertImage = (url, addToMedia = true) => {
    const editor = contentRef.current;
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.contentEditable = true;
    img.draggable = true;
    
    editor.appendChild(img);
  };

  const insertVideo = (url, addToMedia = true) => {
    const editor = contentRef.current;
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.style.maxWidth = '100%';
    video.style.height = 'auto';
    video.contentEditable = true;
    video.draggable = true;
    video.onclick = () => handleMediaDelete(video, 'video', url);
    editor.appendChild(video);
 
  };

  const handleMediaDelete = (element, type, url) => {
    element.remove();
    setMediaItems(prevItems => {
      const newMediaItems = prevItems.filter(item => item.url !== url);
      console.log('Media Items after deleting media:', newMediaItems);
      return newMediaItems;
    });
  };

  const handleDropdownClick = (type) => {
    setDropdownVisible(type);
  };

  const handleUploadFromLocal = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 'video/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      const storageRef = ref(storage, `news/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload failed', error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          type === 'image' ? insertImage(downloadURL) : insertVideo(downloadURL);
        }
      );
    };
    input.click();
  };

  const handleUploadFromLink = async (type) => {
    const url = prompt(`Enter ${type} URL:`);
    if (url) {
      type === 'image' ? insertImage(url) : insertVideo(url);
    }
  };

  return (
    <div className={styles.newsUpdatePage}>
        <Sidebar />
      <h1>News Updates</h1>
      <div className={styles.form}>
        <input 
          type="text" 
          placeholder="Title" 
          value={title_en} 
          onChange={(e) => setTitle_en(e.target.value)} 
        />
        <div className={styles.toolbar}>
          <button onClick={() => document.execCommand('bold')}>B</button>
          <button onClick={() => document.execCommand('italic')}>I</button>
          <button onClick={() => document.execCommand('underline')}>U</button>
          <div className={styles.dropdown}>
            <button onClick={() => handleDropdownClick('image')}>Image</button>
            {dropdownVisible === 'image' && (
              <div className={styles.dropdownContent}>
                <button onClick={() => handleUploadFromLocal('image')}>Upload from Local</button>
                <button onClick={() => handleUploadFromLink('image')}>Add Link</button>
              </div>
            )}
          </div>
          <div className={styles.dropdown}>
            <button onClick={() => handleDropdownClick('video')}>Video</button>
            {dropdownVisible === 'video' && (
              <div className={styles.dropdownContent}>
                <button onClick={() => handleUploadFromLocal('video')}>Upload from Local</button>
                <button onClick={() => handleUploadFromLink('video')}>Add Link</button>
              </div>
            )}
          </div>
        </div>
        <div
          className={styles.editor}
          contentEditable
          ref={contentRef}
          onInput={(e) => setContent(e.currentTarget.innerHTML)}
        ></div>
        <button className={styles.button} onClick={handleUpload}>{editing ? 'Update' : 'Post'}</button>
      </div>
      <div className={styles.newsList}>
        {newsItems.map(item => (
          <div key={item.id} className={styles.newsItem}>
            <h2>{item.title_en}</h2>
            {item.newsItems.map((newsItem, idx) => (
              <div key={idx} className={styles.newsContent}>
                {newsItem.type === 'text' && <div dangerouslySetInnerHTML={{ __html: newsItem.content_en }} />}
                {newsItem.type === 'image' && <img src={newsItem.url} alt="news" />}
                {newsItem.type === 'video' && <video src={newsItem.url} controls />}
              </div>
            ))}
            <div className={styles.actions}>
              <button onClick={() => handleEdit(item)}>Edit</button>
              <button onClick={() => handleDelete(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsUpdatePage;
