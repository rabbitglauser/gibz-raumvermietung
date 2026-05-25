// AI Project Manager - Full autonomous control over the repository

const PROJECT_ID = 'PVT_kwDOD2CXe84BNxxB';
const STATUS_FIELD_ID = 'PVTSSF_lADOD2CXe84BNxxBzg8rIpE';
const PRIORITY_FIELD_ID = 'PVTSSF_lADOD2CXe84BNxxBzg8rIr4';
const SIZE_FIELD_ID = 'PVTSSF_lADOD2CXe84BNxxBzg8rIsk';

const STATUS_MAP = {
    'Backlog': 'a68cf2f2',
    'To Do': '642bff76',
    'In Progress': '7e60500d',
    'Testing': '2c69b71b',
    'Done': '9d3a3454'
};

const PRIORITY_MAP = {
    'P0': 'dbf404f1',
    'P1': 'd550cfe4',
    'P2': '46004bc8'
};

const SIZE_MAP = {
    'XS': 'c731d8ea',
    'S': '914792d2',
    'M': '5d24d619',
    'L': 'a22ca0be',
    'XL': '28b3cf92'
};

module.exports = async ({ github, context, core }) => {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
        console.log('OPENAI_API_KEY not set, skipping');
        return;
    }

    const event = context.eventName;
    const action = context.payload.action;

    console.log(`Event: ${event}, Action: ${action}`);

    // ============================================
    // DETERMINE ITEM (PR or Issue)
    // ============================================

    let item = null;
    let itemType = null;
    let itemNumber = null;
    let checkResults = null;

    if (context.payload.pull_request) {
        item = context.payload.pull_request;
        itemType = 'pull_request';
        itemNumber = item.number;
    } else if (context.payload.issue) {
        const issue = context.payload.issue;
        itemNumber = issue.number;

        // If issue is actually a PR, fetch full PR data to get head.sha etc.
        if (issue.pull_request) {
            const prData = await github.rest.pulls.get({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: issue.number
            });
            item = prData.data;
            itemType = 'pull_request';
        } else {
            item = issue;
            itemType = 'issue';
        }
    } else if (event === 'check_suite') {
        const suite = context.payload.check_suite;
        if (suite.pull_requests && suite.pull_requests.length > 0) {
            const prNum = suite.pull_requests[0].number;
            const prData = await github.rest.pulls.get({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: prNum
            });
            item = prData.data;
            itemType = 'pull_request';
            itemNumber = prNum;
            checkResults = {
                conclusion: suite.conclusion,
                status: suite.status
            };
        }
    }

    if (!item) {
        console.log('No item found for this event');
        return;
    }

    console.log(`Processing ${itemType} #${itemNumber}: ${item.title}`);

    // ============================================
    // COLLECT CONTEXT
    // ============================================

    let diff = '';
    let comments = [];
    let reviews = [];
    let linkedIssues = [];
    let projectStatus = null;

    // Get PR diff
    if (itemType === 'pull_request') {
        try {
            const diffResponse = await github.rest.pulls.get({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: itemNumber,
                mediaType: { format: 'diff' }
            });
            diff = typeof diffResponse.data === 'string'
                ? diffResponse.data.substring(0, 50000)
                : '';
        } catch (e) {
            console.log('Could not get diff:', e.message);
        }

        // Get reviews
        try {
            const reviewsResponse = await github.rest.pulls.listReviews({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: itemNumber
            });
            reviews = reviewsResponse.data.map(r => ({
                author: r.user.login,
                state: r.state,
                body: r.body || '',
                submitted_at: r.submitted_at
            }));
        } catch (e) {
            console.log('Could not get reviews:', e.message);
        }

        // Get check runs
        if (!checkResults) {
            try {
                const checksResponse = await github.rest.checks.listForRef({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    ref: item.head.sha
                });
                const checks = checksResponse.data.check_runs;
                const completed = checks.filter(c => c.status === 'completed');
                const failed = completed.filter(c => c.conclusion !== 'success' && c.conclusion !== 'skipped');
                checkResults = {
                    total: checks.length,
                    completed: completed.length,
                    passed: completed.filter(c => c.conclusion === 'success').length,
                    failed: failed.length,
                    failedChecks: failed.map(c => c.name),
                    allPassed: failed.length === 0 && completed.length > 0
                };
            } catch (e) {
                console.log('Could not get checks:', e.message);
            }
        }
    }

    // Get comments
    try {
        const commentsResponse = await github.rest.issues.listComments({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: itemNumber,
            per_page: 50
        });
        comments = commentsResponse.data.map(c => ({
            author: c.user.login,
            body: c.body,
            created_at: c.created_at,
            isBot: c.user.login.includes('[bot]')
        }));
    } catch (e) {
        console.log('Could not get comments:', e.message);
    }

    // Extract linked issues
    if (itemType === 'pull_request' && item.body) {
        const issueRegex = /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi;
        let match;
        while ((match = issueRegex.exec(item.body)) !== null) {
            try {
                const issueData = await github.rest.issues.get({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    issue_number: parseInt(match[1])
                });
                linkedIssues.push({
                    number: issueData.data.number,
                    title: issueData.data.title,
                    body: (issueData.data.body || '').substring(0, 1000),
                    state: issueData.data.state,
                    labels: issueData.data.labels.map(l => l.name)
                });
            } catch (e) {
                console.log(`Could not get linked issue #${match[1]}`);
            }
        }
    }

    // Get project status
    try {
        const projectQuery = `
      query($nodeId: ID!) {
        node(id: $nodeId) {
          ... on Issue {
            projectItems(first: 5) {
              nodes {
                id
                project { id }
                fieldValues(first: 10) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      field { ... on ProjectV2SingleSelectField { name } }
                      name
                    }
                  }
                }
              }
            }
          }
          ... on PullRequest {
            projectItems(first: 5) {
              nodes {
                id
                project { id }
                fieldValues(first: 10) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      field { ... on ProjectV2SingleSelectField { name } }
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
        const projectResult = await github.graphql(projectQuery, { nodeId: item.node_id });
        const projectItem = projectResult.node?.projectItems?.nodes?.find(
            i => i.project.id === PROJECT_ID
        );
        if (projectItem) {
            projectStatus = { itemId: projectItem.id, fields: {} };
            for (const fv of projectItem.fieldValues.nodes) {
                if (fv.field?.name && fv.name) {
                    projectStatus.fields[fv.field.name] = fv.name;
                }
            }
        }
    } catch (e) {
        console.log('Could not get project status:', e.message);
    }

    // Latest comment for comment events
    let latestComment = null;
    if (event === 'issue_comment') {
        latestComment = {
            author: context.payload.comment.user.login,
            body: context.payload.comment.body
        };
    }

    // Skip if this is our own bot comment (prevents infinite loops)
    if (latestComment?.body?.startsWith('**Bütel AI**')) {
        console.log('Skipping - this is our own bot comment');
        return;
    }

    // ============================================
    // BUILD CONTEXT OBJECT
    // ============================================

    const contextObj = {
        trigger: `${event}.${action}`,
        item: {
            type: itemType,
            number: itemNumber,
            title: item.title,
            body: (item.body || '').substring(0, 3000),
            state: item.state,
            draft: item.draft || false,
            author: item.user.login,
            labels: (item.labels || []).map(l => l.name),
            assignees: (item.assignees || []).map(a => a.login),
            created_at: item.created_at,
            updated_at: item.updated_at
        },
        diff,
        comments: comments.slice(-20),
        reviews,
        linkedIssues,
        checkResults,
        projectStatus,
        latestComment
    };

    if (itemType === 'pull_request') {
        contextObj.item.base = item.base?.ref;
        contextObj.item.head = item.head?.ref;
        contextObj.item.merged = item.merged || false;
        contextObj.item.mergeable = item.mergeable;
        contextObj.item.mergeable_state = item.mergeable_state;
    }

    console.log('Context:', JSON.stringify({
        trigger: contextObj.trigger,
        item: { type: contextObj.item.type, number: contextObj.item.number },
        diffLength: contextObj.diff.length,
        commentsCount: contextObj.comments.length,
        checkResults: contextObj.checkResults
    }, null, 2));

    // ============================================
    // BUILD PROMPT
    // ============================================

    const itemDetails = `Type: ${contextObj.item.type}
Number: #${contextObj.item.number}
Title: ${contextObj.item.title}
State: ${contextObj.item.state}
Draft: ${contextObj.item.draft}
Author: @${contextObj.item.author}
Labels: ${contextObj.item.labels.join(', ') || 'none'}
Assignees: ${contextObj.item.assignees.join(', ') || 'none'}`;

    const prDetails = contextObj.item.type === 'pull_request'
        ? `\nBranch: ${contextObj.item.head} -> ${contextObj.item.base}\nMerged: ${contextObj.item.merged}\nMergeable: ${contextObj.item.mergeable_state}`
        : '';

    const diffSection = contextObj.diff
        ? `\n## Code Diff (${contextObj.diff.length} chars)\n\`\`\`diff\n${contextObj.diff.substring(0, 30000)}\n\`\`\``
        : '';

    const commentsSection = contextObj.comments.length > 0
        ? `\n## Recent Comments (${contextObj.comments.length})\n${contextObj.comments.map(c => `@${c.author}: ${c.body.substring(0, 500)}`).join('\n\n')}`
        : '';

    const reviewsSection = contextObj.reviews.length > 0
        ? `\n## Reviews\n${contextObj.reviews.map(r => `@${r.author} [${r.state}]: ${r.body.substring(0, 300)}`).join('\n')}`
        : '';

    const linkedSection = contextObj.linkedIssues.length > 0
        ? `\n## Linked Issues\n${contextObj.linkedIssues.map(i => `#${i.number} (${i.state}): ${i.title}`).join('\n')}`
        : '';

    const checksSection = contextObj.checkResults
        ? JSON.stringify(contextObj.checkResults, null, 2)
        : 'No check results available';

    const projectSection = contextObj.projectStatus
        ? JSON.stringify(contextObj.projectStatus.fields, null, 2)
        : 'Not in project';

    const latestCommentSection = contextObj.latestComment
        ? `\n## Latest Comment (triggered this event)\n@${contextObj.latestComment.author}: ${contextObj.latestComment.body}`
        : '';

    const prompt = `You are the AI Project Manager for Butel, a Swiss restaurant ordering platform with WhatsApp integration.

You have FULL AUTHORITY to manage this repository. Analyze the context and decide what actions to take.

## Current Event
${contextObj.trigger}

## Item Details
${itemDetails}${prDetails}

## Description
${contextObj.item.body || '(empty)'}
${diffSection}
${commentsSection}
${reviewsSection}
${linkedSection}

## Check Results
${checksSection}

## Current Project Status
${projectSection}
${latestCommentSection}

## Your Capabilities

### Workflow Status
- move_to_status: "Backlog" | "To Do" | "In Progress" | "Testing" | "Done"

### Labels
- add_labels: ["label1", "label2"]
- remove_labels: ["label1"]

### Project Fields
- set_priority: "P0" | "P1" | "P2"
- set_size: "XS" | "S" | "M" | "L" | "XL"

### Comments & Reactions
- add_comment: "message"
- add_reaction: "rocket" | "eyes" | "heart" | "+1" | "-1"

### PR Actions
- request_reviewers: ["username"]
- approve: "message"
- request_changes: "message"
- merge: true

### Issue/PR Actions
- close: "completed" | "not_planned"
- reopen: true
- assign: ["username"]

## Decision Guidelines

### Workflow Transitions
- New issue -> "Backlog"
- New PR opened -> "Testing"
- PR merged -> "Done" + close linked issues
- PR closed without merge -> "Backlog"

### Slash Commands (if in latest comment)
- /status <name> -> move_to_status
- /priority <p0|p1|p2> -> set_priority
- /size <xs|s|m|l|xl> -> set_size
- /merge or "please merge" -> merge (if checks pass)
- /close -> close
- /approve or /lgtm -> approve

### Code Review
For PR events, review the diff for bugs/security/performance issues.
If issues found -> request_changes. If good + tests pass -> approve.

### Check Results
Look at the "Check Results" section above. If checkResults.allPassed is true, tests have passed.
If checkResults is null or allPassed is false, tests have not passed yet.

### Autonomy & Communication
- Act confidently and proactively, you have FULL ACCESS
- ALWAYS add a comment explaining your actions and reasoning
- When someone asks to merge: comment explaining if you can merge (tests passed) or why not
- Share your thoughts on code quality, architecture, potential issues
- On new PRs, comment with your analysis of the changes
- On new issues, comment with suggestions or questions
- Be helpful, communicative, and thorough
- Never take an action silently - always explain what you're doing via comment

## Response Format
Return ONLY valid JSON:
{
  "reasoning": "Brief explanation",
  "actions": [
    { "type": "move_to_status", "value": "Testing" }
  ]
}

If no action needed:
{
  "reasoning": "Why",
  "actions": []
}`;

    // ============================================
    // CALL AI
    // ============================================

    console.log('Calling GPT-4o...');

    let aiResponse;
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0.2
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON in AI response');
        }

        aiResponse = JSON.parse(jsonMatch[0]);
        console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

    } catch (e) {
        console.error('AI call failed:', e.message);
        return;
    }

    if (!aiResponse.actions || aiResponse.actions.length === 0) {
        console.log('No actions to take:', aiResponse.reasoning);
        return;
    }

    // ============================================
    // EXECUTE ACTIONS
    // ============================================

    console.log(`Executing ${aiResponse.actions.length} actions...`);

    // Ensure item is in project
    let projectItemId = projectStatus?.itemId;
    if (!projectItemId) {
        try {
            const addResult = await github.graphql(`
        mutation($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
            item { id }
          }
        }
      `, {
                projectId: PROJECT_ID,
                contentId: item.node_id
            });
            projectItemId = addResult.addProjectV2ItemById.item.id;
            console.log('Added to project:', projectItemId);
        } catch (e) {
            console.log('Could not add to project:', e.message);
        }
    }

    for (const action of aiResponse.actions) {
        try {
            console.log(`Executing: ${action.type} = ${JSON.stringify(action.value)}`);

            switch (action.type) {
                case 'move_to_status': {
                    const optionId = STATUS_MAP[action.value];
                    if (optionId && projectItemId) {
                        await github.graphql(`
              mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
                updateProjectV2ItemFieldValue(input: {
                  projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
                  value: { singleSelectOptionId: $value }
                }) { projectV2Item { id } }
              }
            `, {
                            projectId: PROJECT_ID,
                            itemId: projectItemId,
                            fieldId: STATUS_FIELD_ID,
                            value: optionId
                        });
                        console.log(`Moved to ${action.value}`);
                    }
                    break;
                }

                case 'set_priority': {
                    const optionId = PRIORITY_MAP[action.value];
                    if (optionId && projectItemId) {
                        await github.graphql(`
              mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
                updateProjectV2ItemFieldValue(input: {
                  projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
                  value: { singleSelectOptionId: $value }
                }) { projectV2Item { id } }
              }
            `, {
                            projectId: PROJECT_ID,
                            itemId: projectItemId,
                            fieldId: PRIORITY_FIELD_ID,
                            value: optionId
                        });
                        console.log(`Set priority to ${action.value}`);
                    }
                    break;
                }

                case 'set_size': {
                    const optionId = SIZE_MAP[action.value.toUpperCase()];
                    if (optionId && projectItemId) {
                        await github.graphql(`
              mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
                updateProjectV2ItemFieldValue(input: {
                  projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
                  value: { singleSelectOptionId: $value }
                }) { projectV2Item { id } }
              }
            `, {
                            projectId: PROJECT_ID,
                            itemId: projectItemId,
                            fieldId: SIZE_FIELD_ID,
                            value: optionId
                        });
                        console.log(`Set size to ${action.value}`);
                    }
                    break;
                }

                case 'add_labels': {
                    const labels = Array.isArray(action.value) ? action.value : [action.value];
                    await github.rest.issues.addLabels({
                        owner: context.repo.owner,
                        repo: context.repo.repo,
                        issue_number: itemNumber,
                        labels
                    });
                    console.log(`Added labels: ${labels.join(', ')}`);
                    break;
                }

                case 'remove_labels': {
                    const labels = Array.isArray(action.value) ? action.value : [action.value];
                    for (const label of labels) {
                        try {
                            await github.rest.issues.removeLabel({
                                owner: context.repo.owner,
                                repo: context.repo.repo,
                                issue_number: itemNumber,
                                name: label
                            });
                        } catch (e) { /* Label might not exist */ }
                    }
                    console.log(`Removed labels: ${labels.join(', ')}`);
                    break;
                }

                case 'add_comment': {
                    await github.rest.issues.createComment({
                        owner: context.repo.owner,
                        repo: context.repo.repo,
                        issue_number: itemNumber,
                        body: `**Bütel AI**\n\n${action.value}`
                    });
                    console.log('Added comment');
                    break;
                }

                case 'add_reaction': {
                    const reaction = action.value;
                    if (latestComment && context.payload.comment) {
                        await github.rest.reactions.createForIssueComment({
                            owner: context.repo.owner,
                            repo: context.repo.repo,
                            comment_id: context.payload.comment.id,
                            content: reaction
                        });
                    } else {
                        await github.rest.reactions.createForIssue({
                            owner: context.repo.owner,
                            repo: context.repo.repo,
                            issue_number: itemNumber,
                            content: reaction
                        });
                    }
                    console.log(`Added reaction: ${reaction}`);
                    break;
                }

                case 'assign': {
                    const users = Array.isArray(action.value) ? action.value : [action.value];
                    await github.rest.issues.addAssignees({
                        owner: context.repo.owner,
                        repo: context.repo.repo,
                        issue_number: itemNumber,
                        assignees: users
                    });
                    console.log(`Assigned: ${users.join(', ')}`);
                    break;
                }

                case 'request_reviewers': {
                    if (itemType === 'pull_request') {
                        const reviewers = Array.isArray(action.value) ? action.value : [action.value];
                        await github.rest.pulls.requestReviewers({
                            owner: context.repo.owner,
                            repo: context.repo.repo,
                            pull_number: itemNumber,
                            reviewers
                        });
                        console.log(`Requested reviewers: ${reviewers.join(', ')}`);
                    }
                    break;
                }

                case 'approve': {
                    if (itemType === 'pull_request') {
                        await github.rest.pulls.createReview({
                            owner: context.repo.owner,
                            repo: context.repo.repo,
                            pull_number: itemNumber,
                            event: 'APPROVE',
                            body: action.value || 'LGTM'
                        });
                        console.log('Approved PR');
                    }
                    break;
                }

                case 'request_changes': {
                    if (itemType === 'pull_request') {
                        await github.rest.pulls.createReview({
                            owner: context.repo.owner,
                            repo: context.repo.repo,
                            pull_number: itemNumber,
                            event: 'REQUEST_CHANGES',
                            body: action.value
                        });
                        console.log('Requested changes');
                    }
                    break;
                }

                case 'merge': {
                    if (itemType === 'pull_request' && action.value === true) {
                        try {
                            await github.rest.pulls.merge({
                                owner: context.repo.owner,
                                repo: context.repo.repo,
                                pull_number: itemNumber,
                                merge_method: 'squash'
                            });
                            console.log('Merged PR');
                        } catch (e) {
                            console.log('Could not merge:', e.message);
                            await github.rest.issues.createComment({
                                owner: context.repo.owner,
                                repo: context.repo.repo,
                                issue_number: itemNumber,
                                body: `**Bütel AI**\n\nCould not auto-merge: ${e.message}`
                            });
                        }
                    }
                    break;
                }

                case 'close': {
                    await github.rest.issues.update({
                        owner: context.repo.owner,
                        repo: context.repo.repo,
                        issue_number: itemNumber,
                        state: 'closed',
                        state_reason: action.value || 'completed'
                    });
                    console.log(`Closed as ${action.value}`);
                    break;
                }

                case 'reopen': {
                    await github.rest.issues.update({
                        owner: context.repo.owner,
                        repo: context.repo.repo,
                        issue_number: itemNumber,
                        state: 'open'
                    });
                    console.log('Reopened');
                    break;
                }

                default:
                    console.log(`Unknown action: ${action.type}`);
            }

        } catch (e) {
            console.error(`Action ${action.type} failed:`, e.message);
        }
    }

    console.log('All actions completed');
};
