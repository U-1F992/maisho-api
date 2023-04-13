import type { VercelRequest, VercelResponse } from '@vercel/node';

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ARTICLES_URL = "https://mainichi.jp/maisho/ch190944831i/6%E3%81%95%E3%81%84%E3%81%8B%E3%82%89%E3%81%AE%E3%83%8B%E3%83%A5%E3%83%BC%E3%82%B9";

async function getArticleURLs(url: string) {
    const document = await fetch(url)
        .then(res => res.text())
        .then(text => new DOMParser().parseFromString(text, "text/html"));
    return Array.from(document.querySelectorAll<HTMLAnchorElement>("ul.panellist.is-4col.js-morelist>li>a")).map(elem => elem.href);
}

type Article = {
    title: string;
    body: string;
}

async function getArticle(url: string): Promise<Article> {
    await sleep(500);
    const document = await fetch(url)
        .then(res => res.text())
        .then(text => new DOMParser().parseFromString(text, "text/html"));

    const title = document.querySelector("h1.title-page")?.textContent?.trim() ?? "";
    const body = document.querySelector("#articledetail-body>p")?.innerHTML?.trim()
        .replace(/<ruby><rb>(.+?)<\/rb>(.+?)<\/ruby>/g, "$1") ?? "";

    return { title, body };
}

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {

    response.status(200).json({
        body: await Promise.all((await getArticleURLs(ARTICLES_URL)).map(url => getArticle(url))),
        query: request.query,
        cookies: request.cookies,
    });
}