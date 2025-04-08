import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Jobs } from "./Jobs";
export enum UserRole {
    ADMIN = "admin",
    USER = "user"
}

@Entity("users")
export class Users extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255, nullable: false })
    name: string;

    @Column({ type: "varchar", length: 255, unique: true, nullable: false })
    email: string;

    @Column({ type: "text", nullable: false })
    password: string;

    @Column({
        type: "enum",
        enum: UserRole,
        nullable: false
    })
    role: UserRole;

    @Column({
        type:"jsonb",
        nullable:false,
        default:{}
    })
    session:string;

    @CreateDateColumn({ type: "timestamp", default: () => "NOW()" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "NOW()" })
    updatedAt: Date;

    @DeleteDateColumn({ type: "timestamp", nullable: true })
    deletedAt: Date | null;

    @OneToMany(() => Jobs, (job) => job.client)
    jobs: Jobs[];
}
