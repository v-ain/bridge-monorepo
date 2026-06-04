import { useEffect, useState } from "react";

// Сетевой запрос в стиле Return-on-Error
export const fetchBlogArticles = async () => {
  try {
    const url = `http://192.168.0.101:3000/blog`;
    const response = await fetch(url);

    if (!response.ok) {
      return { data: null, error: 'ARTICLE_NOT_FOUND' };
    }

    const text = await response.json();
    return { data: text, error: null };
  } catch (err) {
    return { data: null, error: 'NETWORK_ERROR' };
  }
};

export const getBlogTitles = () => {
  const [state, setState] = useState([])
  useEffect(() => {
    const loadArticle = async () => {
      // setMarkdownHtml('$&gt; STREAMING_DATA_FROM_GITHUB...');

      const { data, error } = await fetchBlogArticles();

      if (error) {
        // setMarkdownHtml(`$&gt; ERROR: Unable to resolve stream. Code: ${error}`);
        return;
      }

      if (data) {
        setState(data)
      }
    };

    loadArticle();
  }, []);
  return state
}

