import React, { useState } from 'react';
import { X, Copy, Check, Github, ExternalLink, Terminal, GitBranch, Rocket } from 'lucide-react';

interface GitHubGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubGuideModal: React.FC<GitHubGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: 'Step 1: Create a new repository on GitHub',
      desc: 'Go to github.com/new and create a new public or private repository named "paycheck-lk" (leave "Initialize with README" unchecked).',
      code: '',
    },
    {
      title: 'Step 2: Initialize Git in your project folder',
      desc: 'Open your terminal or command prompt in this project root directory:',
      code: `git init\ngit add .\ngit commit -m "Initial commit: PayCheck.lk Sri Lankan Receipt Verifier"`,
    },
    {
      title: 'Step 3: Connect to your GitHub repository',
      desc: 'Replace YOUR_USERNAME with your GitHub username:',
      code: `git branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/paycheck-lk.git`,
    },
    {
      title: 'Step 4: Push to main branch',
      desc: 'Push your code to GitHub. This triggers the GitHub Pages auto-deploy workflow automatically!',
      code: `git push -u origin main`,
    },
    {
      title: 'Step 5: Enable GitHub Pages in Repository Settings',
      desc: 'Go to your repo on GitHub: Settings -> Pages. Under "Build and deployment", set Source to "GitHub Actions" or choose "Deploy from branch: gh-pages". Your site will be live at https://YOUR_USERNAME.github.io/paycheck-lk/ within 2 minutes!',
      code: '',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">GitHub Publishing Guide</h3>
              <p className="text-xs text-slate-400">
                Deploy PayCheck.lk to GitHub & GitHub Pages with Auto-CI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable instructions */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
            <Rocket className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex-1">
              <strong>All 33 Files Ready:</strong> Everything is compiled and committed on branch <code className="font-mono">main</code>.
            </div>
            <a
              href="/paycheck-lk-project.zip"
              download="paycheck-lk-project.zip"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap shadow-xs"
            >
              Download Project ZIP
            </a>
          </div>

          {/* Alert for empty README.md issue */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>⚠️ GitHub එකේ README.md විතරක් පෙන්නන්නේ ඇයි?</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              GitHub එකේ අලුත් Repo එකක් සාදන විට "Add a README file" තෝරා තිබුණි නම්, GitHub විසින් README පමණක් සහිතව ආරම්භක commit එකක් සාදයි. ඔබගේ සියලුම files (33 files) upload කිරීමට පහත පියවර 2 න් එකක් කරන්න:
            </p>
            <div className="mt-2 p-2.5 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
              <p><strong>ක්‍රමය A:</strong> Terminal එකේ <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-emerald-600 font-bold">git push -u origin main --force</code> ධාවනය කරන්න.</p>
              <p><strong>ක්‍රමය B:</strong> ඉහත <strong>Download Project ZIP</strong> මගින් Zip එක බාගෙන Extract කර, GitHub Repo එකේ <strong>Add file &gt; Upload files</strong> මගින් සියලුම Files Drag &amp; Drop කර Commit කරන්න.</p>
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
              >
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span>{step.title}</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-7">{step.desc}</p>

                {step.code && (
                  <div className="mt-2 ml-7 relative">
                    <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                      {step.code}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(step.code, idx)}
                      className="absolute right-2 top-2 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Copy command"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
