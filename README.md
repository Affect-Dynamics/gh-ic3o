# gh-ic3o

GitHub-native contributor environment for the [ic3o framework](https://github.com/Affect-Dynamics/ic3o-developer-preview).

Early development preview. Requires Git, GitHub CLI and Node 22.13+. The script extension targets POSIX shells; Windows installation is not verified.

```sh
gh extension install Affect-Dynamics/gh-ic3o
gh ic3o whoami
gh ic3o sync
gh ic3o status
gh ic3o inspect
```

The launcher uses the existing GitHub identity. Framework and registry are fetched together from official upstream main, tested and pinned in ~/.ic3o/preview. No automatic edits to applications. Sync executes trusted upstream tests; rollback changes the active revision, not application data. No signed publisher manifest or sandbox yet.

The contributor CLI commands (init, registry search, contribute, report) require upstream PR #19 and its dependencies to be merged. Until then, ordinary runtime commands are available. No interactive dashboard, registry publication or unattended updates yet. Upgrade the launcher with gh extension upgrade ic3o.

This bootstrap includes the snapshot manager from upstream PR #18 at commit 44aef5bd51fd34b24e876c6db7d7091aa217b8ad. Review and license provenance must be confirmed before formal release.
