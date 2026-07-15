export class BlogController {
  constructor(blogService) {
    this.blogService = blogService;
  }

  /**
   * @param {import('http').IncomingMessage} req
   * @param {import('http').ServerResponse} res
   */
  getBlogData = async (req, res) => {
    const posts = await this.blogService.getRemoteMarkdown();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(posts));
  };
}
