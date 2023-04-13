import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JSDOM } from 'jsdom';

const jsdom = new JSDOM();

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDocument(url: string, wait = 100) {
    await sleep(wait);
    return fetch(url)
        .then(res => res.text())
        .then(text => new jsdom.window.DOMParser().parseFromString(text, "text/html"));
}

type ArticleSummary = {
    title: string;
    publishedAt: Date;
    url: string;
    thumbnail: string;
};
async function getArticleSummaries(url: string, count: CountOption): Promise<ArticleSummary[]> {
    const document = await getDocument(url);

    const summaries = Array.from(document.querySelectorAll<HTMLLIElement>("ul.panellist.is-4col.js-morelist>li"))
        .slice(0, count);
    return summaries.map(li => ({
        title: li.querySelector<HTMLHeadingElement>("h3")?.textContent?.trim() ?? "",
        publishedAt: new Date(li.querySelector<HTMLSpanElement>("span.articletag-date")?.textContent?.trim() ?? ""),
        url: "https:" + li.querySelector<HTMLAnchorElement>("a")?.href ?? "",
        thumbnail: li.querySelector<HTMLImageElement>("img")?.src ?? "",
    }));
}

type Article = ArticleSummary & {
    body: string;
};
async function getArticle(summary: ArticleSummary, ruby: RubyOption): Promise<Article> {
    const document = await getDocument(summary.url);

    const body = Array.from(document.querySelectorAll<HTMLParagraphElement>("#articledetail-body>p"))
        .map(p => {
            return (() => {
                switch (ruby) {
                    case "embed":
                        return p.textContent?.trim();
                    case "remove":
                        return p.innerHTML?.trim()
                            .replace(/<ruby><rb>(.+?)<\/rb>.+?<\/ruby>/g, "$1");
                    case "replace":
                        return p.innerHTML?.trim()
                            .replace(/<ruby>.+?<rt>(.+?)<\/rt>.+?<\/ruby>/g, "$1");
                }
            })()?.trim() ?? "";
        })
        .reduce((prev, cur) => prev + '\n' + cur);

    return { body, ...summary };
}

type CountOption = number & { __articleCount: never };
function parseCountOption(input: unknown = 5): CountOption {
    if (typeof input !== "number") {
        return parseCountOption(Number(input));
    }
    if (Number.isNaN(input) || !Number.isInteger(input)) {
        return parseCountOption(0);
    }
    if (input < 0) {
        return parseCountOption(0);
    }
    if (20 < input) {
        return parseCountOption(20);
    }
    return input as CountOption;
}

type RubyOption = "embed" | "replace" | "remove";
function parseRubyOption(input: unknown = "embed"): RubyOption {
    if (input !== "embed" && input !== "replace" && input !== "remove") {
        return parseRubyOption();
    }
    return input as RubyOption;
}

function parseParams({ count, ruby }: { count?: string, ruby?: string }) {
    return { count: parseCountOption(count), ruby: parseRubyOption(ruby) };
}

export default async function (
    request: VercelRequest,
    response: VercelResponse,
) {
    const { count, ruby } = parseParams(request.query);

    const ARTICLES_URL = "https://mainichi.jp/maisho/ch170361626i/%E6%AF%8E%E5%B0%8F%E3%83%8B%E3%83%A5%E3%83%BC%E3%82%B9";
    const summaries = await getArticleSummaries(ARTICLES_URL, count);
    const articles = await Promise.all(summaries.map(url => getArticle(url, ruby)))

    response.status(200).json(articles);
}