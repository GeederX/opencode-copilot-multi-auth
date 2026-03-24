# NPM 发布指南

## 前置步骤（一次性）

### 1. 创建 npm 账户
- 访问 https://www.npmjs.com/signup
- 注册账户并验证邮箱
- 记下用户名

### 2. 登录 npm
```bash
npm login
```
输入用户名、密码和验证码（如果启用了 2FA）

验证登录状态：
```bash
npm whoami
```

### 3. 更新 GitHub 仓库地址
package.json 中有占位符，需要替换为你的实际 GitHub 仓库：

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/opencode-copilot-multi-auth.git"
}
```

## 首次发布步骤

### 1. 确保代码已提交到 GitHub
```bash
git add .
git commit -m "Initial release: multi-account Copilot auth plugin"
git push origin main
```

### 2. 创建 GitHub Release（可选但推荐）
```bash
# 使用 gh CLI（需要安装）
gh release create v0.3.0 --title "v0.3.0" --notes "Initial release"

# 或者在 GitHub 网站手动创建
```

### 3. 验证构建
```bash
npm run build
npm run test
```

### 4. 发布到 npm
```bash
npm publish
```

成功发布后，你会看到：
```
npm notice 📦  opencode-copilot-multi-auth@0.3.0
npm notice === Tarball Contents ===
npm notice ...
npm notice published opencode-copilot-multi-auth@0.3.0
```

### 5. 验证发布
```bash
npm view opencode-copilot-multi-auth
```

访问 https://www.npmjs.com/package/opencode-copilot-multi-auth

## 后续版本更新流程

### 1. 修改版本号
```bash
# 自动更新版本号和 git tag
npm version patch    # 0.3.0 -> 0.3.1（bug 修复）
npm version minor    # 0.3.0 -> 0.4.0（新功能）
npm version major    # 0.3.0 -> 1.0.0（破坏性改动）
```

### 2. 推送到 GitHub
```bash
git push origin main --tags
```

### 3. 发布新版本
```bash
npm publish
```

## 发布前检查清单

- [ ] `npm run build` 成功编译
- [ ] `npm run test` 所有测试通过
- [ ] `README.md` 文档完整
- [ ] `package.json` 中的 GitHub 仓库地址正确
- [ ] `LICENSE` 文件存在
- [ ] `.gitignore` 正确配置（dist 除外）
- [ ] 所有代码已提交到 GitHub
- [ ] 已登录 npm（`npm whoami`）

## 常见问题

### Q: 包名已被占用？
A: npm 包名必须唯一。如果 `opencode-copilot-multi-auth` 已被占用，改为：
- `@YOUR_USERNAME/opencode-copilot-multi-auth`（scope package）
- 或其他唯一的名称

### Q: 发布时权限被拒绝？
A: 运行 `npm logout` 然后 `npm login` 重新登录

### Q: 发布了错误的版本？
A: 发布修复版本即可，旧版本仍可访问但用户会收到 npm 的更新提示

### Q: 需要删除已发布的版本？
A: 在发布后 72 小时内可以运行 `npm unpublish opencode-copilot-multi-auth@0.3.0`

## 更多资源

- npm 官方文档：https://docs.npmjs.com/
- 包管理指南：https://docs.npmjs.com/packages-and-modules
- 语义版本控制：https://semver.org/
