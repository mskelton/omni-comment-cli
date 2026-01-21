#!/usr/bin/env node
// @ts-check

import { omniComment } from '@omni-comment/core'
import { program } from 'commander'

/**
 * @param {boolean} verbose
 */
function createLogger(verbose) {
  return {
    debug: verbose ? console.debug : () => {},
    error: console.error,
    info: console.info,
    warn: console.warn,
  }
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let buf = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => (buf += chunk))
    process.stdin.on('end', () => resolve(buf))
    process.stdin.on('error', reject)
  })
}

program
  .name('omni-comment')
  .description('Combine outputs from many jobs into a single comment')
  .version('1.0.0')
  .requiredOption('--token <token>', 'GitHub token')
  .requiredOption('--repo <repo>', 'GitHub repository')
  .requiredOption('--issue-number <number>', 'GitHub issue/pull request number', (value) =>
    parseInt(value, 10),
  )
  .requiredOption('--section <section>', 'Comment section')
  .option('--message <message>', 'Comment message')
  .option('--config <path>', 'Config file path', 'omni-comment.yml')
  .option('--title <title>', 'Comment title')
  .option('--collapsed', 'Collapse the comment by default', false)
  .option('--stdin', 'Read message from stdin')
  .option('--verbose', 'Verbose output', false)
  .action(async ({ stdin, ...options }) => {
    if (stdin) {
      options.message = await readStdin()
    }

    const result = await omniComment({
      logger: createLogger(options.verbose),
      configPath: options.config,
      collapsed: options.collapsed,
      title: options.title,
      message: options.message,
      section: options.section,
      issueNumber: options.issueNumber,
      repo: options.repo,
      token: options.token,
    })

    if (!result) {
      console.log('No comment was created or updated')
    } else if (result.status === 'created') {
      console.log(`Created comment: ${result.html_url}`)
    } else if (result.status === 'updated') {
      console.log(`Updated comment: ${result.html_url}`)
    }
  })

program.parse()
