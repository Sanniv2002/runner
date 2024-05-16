//Module to perform all file operations

import fs from 'fs/promises';
import path from 'path';

interface FileTreeNode {
    name: string;
    type: 'directory' | 'file';
    filePath: string;
    children?: FileTreeNode[];
}

const generateFileTree = async (dirPath: string): Promise<FileTreeNode[]> => {
    const files: string[] = await fs.readdir(dirPath);
    const fileTree: FileTreeNode[] = [];

    for (const file of files) {
        const relativeFilePath = path.join(dirPath, file);
        const filePath = path.resolve(relativeFilePath);
        const stats = await fs.stat(filePath);

        if (file === 'node_modules' && stats.isDirectory()) {
            continue; // Skip processing children of 'node_modules' directory
        }

        const node: FileTreeNode = {
            name: file,
            type: stats.isDirectory() ? 'directory' : 'file',
            filePath: filePath,
        };

        if (stats.isDirectory()) {
            node.children = await generateFileTree(filePath);
        }

        fileTree.push(node);
    }

    return fileTree;
};

async function updateFile(filePath: string, code:string){
    await fs.access(filePath as string, fs.constants.R_OK | fs.constants.W_OK)
    await fs.writeFile(filePath as string, code)
    return
}

async function createFile(filePath: string){
    await fs.writeFile(filePath, "")
    return
}

async function readFileContents(filePath: string){
    await fs.access(filePath as string, fs.constants.R_OK | fs.constants.W_OK)
    const contents = await fs.readFile(filePath as string, { encoding: 'utf8' });
    return contents
}

export { generateFileTree, updateFile, createFile, readFileContents };
